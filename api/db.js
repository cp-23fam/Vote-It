const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Vérifie la connexion au démarrage
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connecté à la base de données MySQL.');
    conn.release();
  } catch (err) {
    console.log(err);

    console.error('❌ Impossible de se connecter à MySQL :', err.message);
    process.exit(-1);
  }
})();

/**
 * Exécute une requête SQL
 * @param {string} text  - La requête SQL (avec des ? comme placeholders)
 * @param {Array}  params - Les paramètres à injecter
 * @returns {{ rows: Array }} - Format unifié pour rester compatible avec les routes
 */
async function query(text, params) {
  const [rows] = await pool.execute(text, params);
  return { rows };
}

module.exports = { query, pool };
