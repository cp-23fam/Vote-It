const jwt = require('jsonwebtoken');
const db = require('../db');

exports.login = (req, res, next) => {
  const auth = req.get("Authorization");

  if (!auth) {
    return res.status(403).json({ error: "No Header found" })
  }

  try {
    const token = auth.split(" ")[1]

    const user = jwt.verify(token, process.env['JWT_SECRET'])
    req.user = user
    console.log(user);

    next();


  } catch (e) {
    console.log(e);

    return res.status(400).json({ error: "Token wrong!" })
  }



}