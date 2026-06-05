const jwt = require('jsonwebtoken');
const db = require('../db');

exports.login = (req, res, next) => {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) {
    return res.status(401).json({ message: 'No cookie found' })
  }

  // Extraction du token depuis les cookies
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(cookie => {
      const [key, ...value] = cookie.split('=')
      return [key.trim(), value.join('=')]
    })
  )

  const auth = cookies['Authorization']

  if (!auth) {
    return res.status(403).json({ error: "No Header found" })
  }

  try {
    const token = auth.split(" ")[1]

    const user = jwt.verify(token, process.env['JWT_SECRET'])
    req.user = user

    next();


  } catch (e) {
    console.log(e);

    return res.status(400).json({ error: "Token wrong!" })
  }



}