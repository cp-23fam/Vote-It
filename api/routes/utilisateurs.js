const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { authentifier } = require('../middleware/auth');

/**
 * GET /utilisateurs
 * Liste tous les utilisateurs
 */
router.get('/', authentifier, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nom, prenom, email FROM utilisateur ORDER BY nom'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * GET /utilisateurs/:id
 * Récupère un utilisateur par son ID
 */
router.get('/:id', authentifier, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nom, prenom, email FROM utilisateur WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * POST /utilisateurs
 * Crée un nouvel utilisateur (mot de passe hashé)
 */
router.post('/', async (req, res) => {
  const { nom, prenom, email, motDePasse } = req.body;

  if (!nom || !prenom || !email || !motDePasse) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  try {
    const existant = await db.query(
      'SELECT id FROM utilisateur WHERE email = $1',
      [email]
    );

    if (existant.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    const hash = await bcrypt.hash(motDePasse, 12);

    const result = await db.query(
      'INSERT INTO utilisateur (nom, prenom, email, mot_de_passe) VALUES ($1, $2, $3, $4) RETURNING id, nom, prenom, email',
      [nom, prenom, email, hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * PUT /utilisateurs/:id
 * Met à jour un utilisateur
 */
router.put('/:id', authentifier, async (req, res) => {
  const { nom, prenom, email, motDePasse } = req.body;

  try {
    let hash;
    if (motDePasse) {
      hash = await bcrypt.hash(motDePasse, 12);
    }

    const result = await db.query(
      `UPDATE utilisateur
       SET nom = COALESCE($1, nom),
           prenom = COALESCE($2, prenom),
           email = COALESCE($3, email),
           mot_de_passe = COALESCE($4, mot_de_passe)
       WHERE id = $5
       RETURNING id, nom, prenom, email`,
      [nom, prenom, email, hash ?? null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * DELETE /utilisateurs/:id
 * Supprime un utilisateur
 */
router.delete('/:id', authentifier, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM utilisateur WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
