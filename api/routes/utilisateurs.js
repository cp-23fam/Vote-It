const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require("jsonwebtoken")

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  const result = await db.query(
    'SELECT * FROM utilisateur WHERE email = ?',
    [email]
  );

  const utilisateur = result.rows[0];

  if (!utilisateur) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  const motDePasseValide = await bcrypt.compare(password, utilisateur.mot_de_passe);

  if (!motDePasseValide) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  const token = jwt.sign(
    {
      id: utilisateur.id, email: utilisateur.email, nom: utilisateur.nom,
      prenom: utilisateur.prenom,
    },
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
})

router.post("/signup", async (req, res) => {
  const { name, surname, email, password } = req.body;

  const encrypted = await bcrypt.hash(password, 12)

  const result = await db.query("INSERT INTO `utilisateur` (`nom`, `prenom`, `email`, `mot_de_passe`) VALUES (?, ?, ?, ?)", [name, surname, email, encrypted])

  res.status(201).json(result.rows[0])
})


module.exports = router;
