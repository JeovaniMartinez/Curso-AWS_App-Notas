/*!
 * Genera un pool (grupo) de conexiones con la base de datos para usarse de forma global
 *
 * El pool esta disponible de forma global (global.db) y se encarga de las conexiones y reconexiones de
 * manera automática. Solo hay que manejar una nueva conexión de manera explícita para las transacciones.
 *
 * En esta utilidad solo se genera el pool de conexiones, la conexión se obtiene y verifica al hacer consultas.
 */

const mysql = require('mysql2');

// Configuración de la base de datos y el grupo de conexiones
const databaseConfig = {
    host: process.env.DB_HOST, // IP
    port: process.env.DB_PORT, // Puerto
    user: process.env.DB_USER, // Usuario
    password: process.env.DB_PASSWORD, // Contraseña
    database: process.env.DB_DATABASE_NAME, // Base de datos
    // Ajustes del pool (npmjs.com/package/mysql2#using-connection-pools)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0, // Cero es sin límite
};

global.db = mysql.createPool(databaseConfig); // Para que siempre este disponible el objeto db
