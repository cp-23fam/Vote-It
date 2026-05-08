const express = require('express');
const router = express.Router();

const authRoutes = require('./routes/auth');
const utilisateurRoutes = require('./routes/utilisateurs');
const siegeRoutes = require('./routes/sieges');
const seanceRoutes = require('./routes/seances');
const voteRoutes = require('./routes/votes');

router.use('/auth', authRoutes);
router.use('/utilisateurs', utilisateurRoutes);
router.use('/sieges', siegeRoutes);
router.use('/seances', seanceRoutes);
router.use('/votes', voteRoutes);

module.exports = router;
