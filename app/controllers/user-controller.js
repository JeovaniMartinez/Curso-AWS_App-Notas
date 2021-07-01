/*!
 * Controlador para los usuarios
 */

const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
const jwt = require('jsonwebtoken');

// Configuración del servicio de Amazon  SES. Referencia: https://github.com/awsdocs/aws-doc-sdk-examples/blob/master/javascriptv3/example_code/ses/src/ses_sendemail.js
const { SESClient } = require('@aws-sdk/client-ses'); // Se importa el cliente del SDK
const awsSesClient = new SESClient({region: process.env.AWS_REGION}); // Se crea la instancia del cliente
const { SendEmailCommand } = require('@aws-sdk/client-ses');

/** Valida el usuario y envía el correo o el SMS para iniciar sesión */
async function requestLoginCode(req, res) {

    let username = req.body.username || null;
    let userData;

    try {
        const [rows] = await db.promise().execute('SELECT * FROM user WHERE username = ?', [username]);
        userData = rows[0];
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error en la base de datos');
    }

    if (!userData) return res.status(401).send('El usuario especificado no existe');

    // Se genera y guarda el código de acceso y la fecha de expiración
    const accessCode = nanoid();
    const expirationDate = Date.now() + parseInt(process.env.ACCESS_CODE_DURATION);
    try {
        await db.promise().execute('UPDATE user SET accessCode = ?, accessCodeExpirationDate = ? WHERE username = ?', [accessCode, expirationDate, username]);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error en la base de datos');
    }

    // Se verifica si el nombre de usuario corresponde a un correo o un número de teléfono enviar el código por el medio que corresponda
    if (userData.username.includes('@')) {

        // Parámetros del correo
        const emailParams = {
            Destination: {
                ToAddresses: [
                    userData.username, // Destinatario
                ],
            },
            Message: {
                Body: {
                    /* Puede ser Html o solo texto */
                    Html: {
                        Charset: 'UTF-8',
                        Data: `Tu código de acceso para la App de Notas es: <b>${accessCode}</b>`,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Código de Acceso de la App de Notas',
                },
            },
            Source: process.env.EMAIL_SENDER_ADDRESS, // Remitente
        };

        // Se ejecuta el envío del correo
        try {
            const emailResult = await awsSesClient.send(new SendEmailCommand(emailParams));
            console.log(emailResult);
            res.send('ok');
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error al enviar el correo electrónico');
        }

    } else {
        // FUNCIONALIDAD PENDIENTE
        // Código temporal para pruebas
        console.debug('Teléfono, código: ' + accessCode);
        res.send('ok');
    }

}

/** Ejecuta el inicio de sesión */
async function login(req, res) {

    let username = req.body.username || null;
    let accessCode = req.body.accessCode || null;
    let userData;

    try {
        const [rows] = await db.promise().execute('SELECT * FROM user WHERE username = ? and BINARY accessCode = ?', [username, accessCode]);
        userData = rows[0];
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error en la base de datos');
    }

    if (!userData) return res.status(401).send('El código de acceso incorrecto');
    if (Date.now() > userData.accessCodeExpirationDate) return res.status(401).send('El código de acceso ha expirado');

    // Se elimina el código de acceso y la fecha de expiración de los datos del usuario
    try {
        await db.promise().execute('UPDATE user SET accessCode = ?, accessCodeExpirationDate = ? WHERE username = ?', [null, null, username]);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error en la base de datos');
    }

    // Se genera el token de acceso
    const token = jwt.sign(
        { username: userData.username },
        process.env.JWT_SECRET,
        { expiresIn: parseInt(process.env.TOKEN_DURATION) },
    );

    // Se responde con nombre de usuario, el token y la fecha de expiración del token (con un pequeño tiempo menor que cuando expira)
    res.send({
        name: userData.name,
        accessToken: token,
        tokenExpirationTime: Date.now() + (parseInt(process.env.TOKEN_DURATION) * 1000) - 30000
    });
}

// Se exportan las funciones
module.exports = {
    requestLoginCode,
    login,
};
