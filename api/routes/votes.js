const express = require('express');
const router = express.Router();
const db = require('../db');
const { authentifier } = require('../middleware/auth');

/**
 * POST /votes
 * Envoi du vote d'un utilisateur sur son siège
 * Body: { vote: 'oui' | 'non' | 'neutre' }
 * L'utilisateur est identifié via le token JWT
 */
router.post('/', authentifier, async (req, res) => {
  const { vote } = req.body;
  const utilisateurId = req.utilisateur.id; // injecté par le middleware JWT

  const votesValides = ['oui', 'non', 'neutre'];
  if (!vote || !votesValides.includes(vote)) {
    return res.status(400).json({
      error: `Le vote doit être l'une des valeurs suivantes : ${votesValides.join(', ')}.`,
    });
  }

  try {
    // Vérifie qu'une séance est en cours
    const seanceActive = await db.query(
      'SELECT id FROM seance WHERE timestamp_fin IS NULL LIMIT 1'
    );

    if (seanceActive.rows.length === 0) {
      return res.status(403).json({ error: 'Aucune séance de vote en cours.' });
    }

    const seanceId = seanceActive.rows[0].id;

    // Récupère le siège de l'utilisateur dans cette séance
    const siege = await db.query(
      'SELECT id, vote FROM siege WHERE utilisateur_id = $1 AND seance_id = $2',
      [utilisateurId, seanceId]
    );

    if (siege.rows.length === 0) {
      return res.status(403).json({
        error: "Vous n'êtes pas assigné à un siège pour cette séance.",
      });
    }

    if (siege.rows[0].vote !== null) {
      return res.status(409).json({
        error: 'Vous avez déjà voté pour cette séance.',
      });
    }

    // Enregistre le vote
    const result = await db.query(
      'UPDATE siege SET vote = $1 WHERE id = $2 RETURNING id, place, vote',
      [vote, siege.rows[0].id]
    );

    res.json({
      message: 'Vote enregistré avec succès.',
      siege: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
