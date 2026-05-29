const express = require("express");
const router = express.Router();
const db = require("../db");
const { notifyVoteStarted, notifyVoteClosed } = require("../ws");

async function getCurrent() {
  const result = await db.query(
    `SELECT * FROM systeme_vote.seance WHERE fin_seance > NOW() ORDER BY fin_seance DESC LIMIT 1`,
  );
  return result.rows[0] ?? null;
}

// GET /seances — séance en cours
router.get("/", async (req, res) => {
  const vote = await getCurrent();
  if (!vote) return res.status(404).json({ error: "Aucune séance active" });
  res.status(200).json(vote);
});

// POST /seances — créer une nouvelle séance
router.post("/", async (req, res) => {
  const { title, duration } = req.body;

  if (!title || !duration) {
    return res.status(400).json({ error: "title et duration sont requis" });
  }

  // Fermer proprement toute séance encore ouverte
  const current = await getCurrent();
  if (current) {
    await db.query(
      `UPDATE seance SET fin_seance = FROM_UNIXTIME(UNIX_TIMESTAMP() - 1) WHERE id = ?`,
      [current.id],
    );
    await db.query(`DELETE FROM siege WHERE id_seance = ?`, [current.id]);
  }

  const result = await db.query(
    `INSERT INTO seance (question, fin_seance)
     VALUES (?, FROM_UNIXTIME(UNIX_TIMESTAMP() + ?))`,
    [title, duration],
  );

  const id = result.rows.insertId;
  const { rows } = await db.query(
    `SELECT * FROM systeme_vote.seance WHERE id = ?`,
    [id],
  );
  const newVote = rows[0];

  // Notifier tous les clients WebSocket
  notifyVoteStarted(newVote);

  res.status(201).json(newVote);
});

// GET /seances/close — fermer la séance en cours
router.get("/close", async (req, res) => {
  const current = await getCurrent();
  if (!current) return res.status(404).json({ error: "Aucune séance active" });

  await db.query(
    `UPDATE seance SET fin_seance = FROM_UNIXTIME(UNIX_TIMESTAMP() - 1) WHERE id = ?`,
    [current.id],
  );

  // Notifier avant de supprimer les sièges (pour avoir les résultats finaux)
  await notifyVoteClosed(current.id);

  await db.query(`DELETE FROM siege WHERE id_seance = ?`, [current.id]);

  res.status(200).json({ message: "Séance fermée", id: current.id });
});

module.exports = router;
