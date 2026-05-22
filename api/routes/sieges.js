const express = require('express');
const router = express.Router();
const db = require('../db');
const { login } = require('../middleware/auth');

/**
 * GET /sieges
 * Liste tous les sièges
 */
router.get('/', login, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.place, s.vote, s.seance_id,
              u.id AS utilisateur_id, u.nom, u.prenom, u.email
       FROM siege s
       LEFT JOIN utilisateur u ON u.id = s.utilisateur_id
       ORDER BY s.place`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * GET /sieges/:id
 * Récupère un siège par son ID
 */
router.get('/:id', login, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.place, s.vote, s.seance_id,
              u.id AS utilisateur_id, u.nom, u.prenom, u.email
       FROM siege s
       LEFT JOIN utilisateur u ON u.id = s.utilisateur_id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Siège introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * POST /sieges
 * Crée un siège (sans utilisateur assigné par défaut)
 */
router.post('/', login, async (req, res) => {
  const { place, seanceId } = req.body;

  if (!place || !seanceId) {
    return res.status(400).json({ error: 'La place et la séance sont requises.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO siege (place, seance_id) VALUES ($1, $2) RETURNING *',
      [place, seanceId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * POST /sieges/:id/assigner
 * Enregistre un utilisateur sur un siège
 */
router.post('/:id/assigner', login, async (req, res) => {
  const { utilisateurId } = req.body;
  const siegeId = req.params.id;

  if (!utilisateurId) {
    return res.status(400).json({ error: 'utilisateurId est requis.' });
  }

  try {
    // Vérifie que le siège existe et n'est pas déjà pris
    const siege = await db.query('SELECT * FROM siege WHERE id = $1', [siegeId]);

    if (siege.rows.length === 0) {
      return res.status(404).json({ error: 'Siège introuvable.' });
    }

    if (siege.rows[0].utilisateur_id) {
      return res.status(409).json({ error: 'Ce siège est déjà occupé.' });
    }

    // Vérifie que l'utilisateur n'est pas déjà assis quelque part dans cette séance
    const dejaAssis = await db.query(
      'SELECT id FROM siege WHERE utilisateur_id = $1 AND seance_id = $2',
      [utilisateurId, siege.rows[0].seance_id]
    );

    if (dejaAssis.rows.length > 0) {
      return res.status(409).json({ error: 'Cet utilisateur est déjà assigné à un siège pour cette séance.' });
    }

    const result = await db.query(
      `UPDATE siege SET utilisateur_id = $1 WHERE id = $2
       RETURNING id, place, vote, seance_id, utilisateur_id`,
      [utilisateurId, siegeId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * DELETE /sieges/:id/assigner
 * Retire un utilisateur d'un siège
 */
router.delete('/:id/assigner', login, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE siege SET utilisateur_id = NULL, vote = NULL WHERE id = $1
       RETURNING id, place, seance_id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Siège introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * PUT /sieges/:id
 * Met à jour un siège
 */
router.put('/:id', login, async (req, res) => {
  const { place } = req.body;

  try {
    const result = await db.query(
      `UPDATE siege SET place = COALESCE($1, place) WHERE id = $2
       RETURNING *`,
      [place, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Siège introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * DELETE /sieges/:id
 * Supprime un siège
 */
router.delete('/:id', login, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM siege WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Siège introuvable.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
