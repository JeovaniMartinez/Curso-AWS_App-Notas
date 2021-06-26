/*!
 * Controlador para el control de usuarios
 */

const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

/** Valida el usuario y envía el correo o el SMS para iniciar sesión */
async function startLoginProcess(req, res) {

    let username = req.body.username || null;
    let userData;

    try {
        const [rows] = await db.promise().execute('SELECT * FROM user WHERE username = ?', [username]);
        userData = rows[0];
    } catch (err) {
        console.error(err);
        return res.status(500).send('Database error');
    }

    if (!userData) return res.status(401).send('User does not exist');

    // Se genera y guarda el código de acceso
    const accessCode = nanoid()

    try {
        await db.promise().execute('UPDATE user SET accessCode = ? WHERE username = ?', [accessCode, username]);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Database error');
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

// Se exportan las funciones
module.exports = {
    startLoginProcess,
};
