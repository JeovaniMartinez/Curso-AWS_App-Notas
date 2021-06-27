/*!
 * Archivo principal de la aplicación
 */

// Importación de módulos requeridos
require('dotenv').config({ path: '.env' }); // Configura las variables de entorno para poder usarlas en cualquier parte
const http = require('http');
const https = require('https');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const securityTokenMiddleware = require('./middleware/token-authentication');
require('./database/database-connection-pool'); // Para establecer la conexión con la base de datos
const userController = require('./controllers/user-controller');
const notesController = require('./controllers/notes-controller');

// Configuración general
console.info('Starting Notes App...');
const app = express(); // Aplicación de express
app.use(helmet()); // Para seguridad
app.use(cors()); // Para habilitar CORS, usar solo si es necesario
app.use(compression()); // Habilitar la compresión
app.use(express.urlencoded({ limit: '16mb', extended: true })); // Para poder procesar los datos de la solicitud, con el límite de tamaño indicado
app.use(express.json({ limit: '16mb', extended: true })); // Para poder manejar los datos de la solicitud como JSON, con el límite de tamaño indicado

// Se encarga de manejar errores en los servidores, mandando la información al log y finalizando la aplicación
function handleServerError(err, serverName) {
    console.error(`Error in server ${serverName} `, err);
    process.exit(1);
}

// Creación de Servidor HTTP
const serverHttp = http.createServer(app);
serverHttp.listen(process.env.HTTP_PORT, process.env.IP);
serverHttp.on('listening', () => console.info(`Notes App running at http://${process.env.IP}:${process.env.HTTP_PORT}`));
serverHttp.on('error', (err) => handleServerError(err, 'http'));

// Creación de Servidor HTTPS
/*
const httpsServerOptions = {
    key: fs.readFileSync(`${process.env.CERTIFICATE_PATH}privkey.pem`),
    cert: fs.readFileSync(`${process.env.CERTIFICATE_PATH}fullchain.pem`),
};
const serverHttps = https.createServer(httpsServerOptions, app);
serverHttps.listen(process.env.HTTPS_PORT, process.env.IP);
serverHttp.on('listening', () => console.info(`Notes App running at https://${process.env.IP}:${process.env.HTTPS_PORT}`));
serverHttps.on('error', (err) => handleServerError(err, 'https'));
*/

// Redireccionamiento de http a https, debe ser el primer app.use, solo usar si esta habilitado el servidor https y si es requerido
/*
app.use((req, res, next) => {
    if (req.secure) next(); else res.redirect(`https://${req.headers.host}${req.url}`);
});
*/

// Servicio de archivos estáticos, se especifica también la ubicación del archivo index, sebe ser el segundo app.use
app.use(express.static('./public', { index: 'index.html' }));

// Verificación de de la sintaxis de la petición
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send('Solicitud incorrecta');
    }
    return next(); // Si la solicitud es correcta, continúa al siguiente paso
});

// Rutas de la API
app.post('/api/user/request-login-code', userController.requestLoginCode);
app.post('/api/user/login', userController.login);
app.use('/api/notes', securityTokenMiddleware); // Todas las rutas de las notas requieren autenticación
app.get('/api/notes/list', notesController.listNotes);
app.post('/api/notes/create', notesController.createNote);
app.patch('/api/notes/update', notesController.updateNote);
app.delete('/api/notes/delete', notesController.deleteNote);

// Error 404, siempre debe ser la última ruta
app.get('*', (req, res) => {
    res.status(404).send("Error 404 - Página no encontrada");
});
