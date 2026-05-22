const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { login } = require('../middleware/auth');

router.post("/login", (req, res) => {
  // 
})



module.exports = router;
