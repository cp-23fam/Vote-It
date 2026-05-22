const express = require('express');
const router = express.Router();
const db = require('../db');

async function getCurrent() {
  const result = await db.query(`SELECT * FROM systeme_vote.seance WHERE fin_seance > UNIX_TIMESTAMP();`)

  return result.rows[0]
}

router.get("/", async (req, res) => {

  const result = getCurrent()

  res.status(200).json(result)
})

router.post('/', async (req, res) => {
  const { title, duration } = req.body


  const result = await db.query(
    `INSERT INTO seance (question, fin_seance)
VALUES (
    ?,
    FROM_UNIXTIME(UNIX_TIMESTAMP() + ?)
);`, [title, duration]
  );

  res.status(200).json(result.rows[0])
})

router.get('/close', async (req, res) => {
  const current = await getCurrent()

  const result = await db.query(
    `UPDATE seance
SET fin_seance = FROM_UNIXTIME(UNIX_TIMESTAMP() - 1)
WHERE id = ?`, [current.id]
  );

  res.status(200).json(result.rows[0])
})

module.exports = router;
