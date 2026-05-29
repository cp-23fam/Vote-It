const express = require("express");
const router = express.Router();
const db = require("../db");
const { login } = require("../middleware/auth");
const { notifySeatJoined, notifySeatVoted } = require("../ws");

async function getCurrent() {
  const result = await db.query(
    `SELECT * FROM systeme_vote.seance WHERE fin_seance > NOW() ORDER BY fin_seance DESC LIMIT 1`,
  );
  return result.rows[0] ?? null;
}

// POST /sieges/link/:place — associer un utilisateur à une place
router.post("/link/:place", login, async (req, res) => {
  const current = await getCurrent();
  if (!current) {
    return res.status(404).json({ error: "Aucune séance active" });
  }

  const place = req.params.place;

  // Vérifier si la place est déjà prise
  const { rows: existing } = await db.query(
    `SELECT id FROM siege WHERE id_seance = ? AND place = ?`,
    [current.id, place],
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: "Place déjà occupée" });
  }

  // Vérifier si l'utilisateur a déjà une place dans cette séance
  const { rows: userSeat } = await db.query(
    `SELECT id FROM siege WHERE id_seance = ? AND id_utilisateur = ?`,
    [current.id, req.user.id],
  );
  if (userSeat.length > 0) {
    return res.status(409).json({ error: "Utilisateur déjà assis" });
  }

  await db.query(
    `INSERT INTO siege (id_utilisateur, id_seance, place) VALUES (?, ?, ?)`,
    [req.user.id, current.id, place],
  );

  // Notifier via WebSocket
  notifySeatJoined(place, req.user, current.id);

  res.status(201).json({ place, seance_id: current.id });
});

// POST /sieges/vote — enregistrer un vote
router.post("/vote", login, async (req, res) => {
  const { vote } = req.body;

  if (!["oui", "non", "neutre"].includes(vote)) {
    return res
      .status(400)
      .json({ error: "Vote invalide. Valeurs: oui, non, neutre" });
  }

  const current = await getCurrent();
  if (!current) {
    return res.status(404).json({ error: "Aucune séance active" });
  }

  // Récupérer le siège de l'utilisateur pour avoir la place
  const { rows: sieges } = await db.query(
    `SELECT id, place FROM siege WHERE id_utilisateur = ? AND id_seance = ?`,
    [req.user.id, current.id],
  );

  if (sieges.length === 0) {
    return res
      .status(404)
      .json({ error: "Utilisateur sans siège dans la séance actuelle" });
  }

  const siege = sieges[0];

  await db.query(`UPDATE siege SET vote = ? WHERE id = ?`, [vote, siege.id]);

  // Notifier via WebSocket (calcule aussi les résultats)
  await notifySeatVoted(siege.place, vote, current.id);

  res.sendStatus(200);
});

module.exports = router;
