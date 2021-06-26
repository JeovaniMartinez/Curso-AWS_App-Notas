/*!
 * Middleware para autenticar peticiones en base a un JWT
 */

const jwt = require('jsonwebtoken');

/** Si el token es válido continua en el siguiente paso, de lo contrario responde con el mensaje de error correspondiente */
function isAuth(req, res, next) {

    const accessToken = req.headers['access-token'];

    if (!accessToken) return res.status(401).send('Falta el token de acceso');

    // Verifica si el token es válido
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Token de acceso no válido');
        }

        // Si es correcto, agrega la información del token al request y continúa en el siguiente paso
        req.tokenData = decoded;
        return next();
    });
}

module.exports = isAuth;
