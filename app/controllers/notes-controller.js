/*!
 * Controlador para las notas
 */

/** Devuelve una la lista de todas las notas del usuario */
async function listNotes(req, res) {
    res.send('ok'); // Temporal
}

// Se exportan las funciones
module.exports = {
    listNotes,
};
