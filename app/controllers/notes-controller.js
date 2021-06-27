/*!
 * Controlador para las notas
 */

/** Devuelve una la lista de todas las notas del usuario */
async function listNotes(req, res) {
    let data;
    try {
        // El nombre de usuario se obtiene de los datos del token
        const [rows] = await db.promise().execute('SELECT * FROM note WHERE username = ?', [req.tokenData.username]);
        data = rows;
        res.send(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error en la base de datos');
    }
}

/** Crea una nueva nota */
async function createNote(req, res) {

    const { title, content } = req.body;
    if (!title || !content) return res.status(422).send('Datos incorrectos'); // Validación

    try {
        const result = await db.promise().execute(
            'INSERT INTO note VALUES (DEFAULT, ?, ?, ?, ?)',
            [title, content, Date.now(), req.tokenData.username]
        );

        if (result[0].affectedRows === 1) res.send('ok');
        else return res.status(500).send('Error en la base de datos');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error en la base de datos');
    }

}

/** Actualiza una nota */
async function updateNote(req, res) {

    const { id, title, content } = req.body;
    if (!id || !title || !content) return res.status(422).send('Datos incorrectos'); // Validación

    try {
        const result = await db.promise().execute(
            'UPDATE note SET title = ?, content = ?, datetime = ? WHERE id = ?',
            [title, content, Date.now(), id]
        );

        if (result[0].affectedRows === 1) res.send('ok');
        else return res.status(404).send('La nota especificada no existe');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error en la base de datos');
    }

}

/** Elimina una nota */
async function deleteNote(req, res) {

    const { id } = req.body;
    if (!id) return res.status(422).send('Datos incorrectos'); // Validación

    try {
        const result = await db.promise().execute('DELETE FROM note WHERE id = ?', [id]);

        if (result[0].affectedRows === 1) res.send('ok');
        else return res.status(404).send('La nota especificada no existe');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error en la base de datos');
    }

}


// Se exportan las funciones
module.exports = {
    listNotes,
    createNote,
    updateNote,
    deleteNote,
};
