/*!
 * Controlador para los usuarios
 */

const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
const jwt = require('jsonwebtoken');

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
    try {
        const expirationDate = Date.now() + parseInt(process.env.ACCESS_CODE_DURATION)
        await db.promise().execute('UPDATE user SET accessCode = ?, accessCodeExpirationDate = ? WHERE username = ?', [accessCode, expirationDate, username]);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error en la base de datos');
    }

    // Se verifica si el nombre de usuario corresponde a un correo o un número de teléfono
    if (userData.username.includes('@')) {
        // Temporal
        console.debug('Correo, código: ' + accessCode);
        res.send('ok');
    } else {
        // Temporal
        console.debug('Teléfono, código: ' + accessCode);
        res.send('ok');
    }

}

/** Valida el usuario y envía el correo o el SMS para iniciar sesión */
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
