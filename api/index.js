require('dotenv').config({ quiet: true })
const express = require('express');
const app = express();

const utilisateurRoutes = require('./routes/utilisateurs');
const siegeRoutes = require('./routes/sieges');
const seanceRoutes = require('./routes/seances');
const voteRoutes = require('./routes/votes');
const bodyParser = require('body-parser');

app.use(bodyParser.json())

app.use('/utilisateurs', utilisateurRoutes);
app.use('/sieges', siegeRoutes);
app.use('/seances', seanceRoutes);
app.use('/votes', voteRoutes);

app.listen(3000, () => {
    console.log("listening on http://localhost:3000");
})
