const express = require('express');
const router = express.Router();
const db = require('../db');
const { authentifier } = require('../middleware/auth');

/**
 * GET /seances
 * Liste toutes les séances
 */
router.get('/', authentifier, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM seance ORDER BY timestamp_fin DESC NULLS FIRST'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * GET /seances/:id
 * Récupère une séance avec ses sièges
 */
router.get('/:id', authentifier, async (req, res) => {
  try {
    const seance = await db.query('SELECT * FROM seance WHERE id = $1', [req.params.id]);

    if (seance.rows.length === 0) {
      return res.status(404).json({ error: 'Séance introuvable.' });
    }

    const sieges = await db.query(
      `SELECT s.id, s.place, s.vote,
              u.id AS utilisateur_id, u.nom, u.prenom, u.email
       FROM siege s
       LEFT JOIN utilisateur u ON u.id = s.utilisateur_id
       WHERE s.seance_id = $1
       ORDER BY s.place`,
      [req.params.id]
    );

    res.json({
      ...seance.rows[0],
      sieges: sieges.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * POST /seances/ouvrir
 * Ouvre une nouvelle session de vote (timestamp_fin NULL = session active)
 */
router.post('/ouvrir', authentifier, async (req, res) => {
  try {
    // Vérifie qu'il n'y a pas déjà une séance ouverte
    const active = await db.query(
      'SELECT id FROM seance WHERE timestamp_fin IS NULL'
    );

    if (active.rows.length > 0) {
      return res.status(409).json({
        error: 'Une séance est déjà en cours.',
        seanceId: active.rows[0].id,
      });
    }

    const result = await db.query(
      'INSERT INTO seance (timestamp_fin) VALUES (NULL) RETURNING *'
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * POST /seances/:id/fermer
 * Ferme une session de vote (pose le timestamp de fin)
 */
router.post('/:id/fermer', authentifier, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE seance SET timestamp_fin = NOW()
       WHERE id = $1 AND timestamp_fin IS NULL
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Séance introuvable ou déjà fermée.',
      });
    }

    // Récupère le résumé des votes
    const votes = await db.query(
      `SELECT vote, COUNT(*) AS total
       FROM siege
       WHERE seance_id = $1 AND vote IS NOT NULL
       GROUP BY vote`,
      [req.params.id]
    );

    res.json({
      seance: result.rows[0],
      resultats: votes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * DELETE /seances/:id
 * Supprime une séance
 */
router.delete('/:id', authentifier, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM seance WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Séance introuvable.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
