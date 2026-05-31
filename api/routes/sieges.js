const express = require('express');
const router = express.Router();
const db = require('../db');
const { login } = require('../middleware/auth');

async function getCurrent() {
  const result = await db.query(`SELECT * FROM systeme_vote.seance WHERE fin_seance > now() ORDER BY fin_seance DESC;`)

  return result.rows[0]
}

router.post("/link/:place", login, async (req, res) => {
  const current = await getCurrent()

  console.log(req.user);
  console.log(current);


  const result = await db.query("INSERT INTO `systeme_vote`.`siege` (`id_utilisateur`, `id_seance`, `place`) VALUES (?, ?, ?);", [req.user.id, current.id, req.params.place]);

  res.status(200).json(result.rows[0])
})

router.post("/vote", login, async (req, res) => {
  const { vote } = req.body;

  await db.query("UPDATE `systeme_vote`.`siege` SET `vote` = ? WHERE id_utilisateur = ?;", [vote, req.user.id])

  res.sendStatus(200)
})

module.exports = router;
