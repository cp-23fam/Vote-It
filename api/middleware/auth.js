const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // ton client SQL (pg, mysql2, etc.)

/**
 * POST /auth/login
 * Connexion d'un utilisateur (mot de passe hashé en DB)
 */
router.post('/login', async (req, res) => {
  const { email, motDePasse } = req.body;

  if (!email || !motDePasse) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM utilisateur WHERE email = $1',
      [email]
    );

    const utilisateur = result.rows[0];

    if (!utilisateur) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);

    if (!motDePasseValide) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const token = jwt.sign(
      { id: utilisateur.id, email: utilisateur.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
