require("dotenv").config({ quiet: true });
const http = require("http");
const express = require("express");
const cors = require("cors");
const app = express();

const utilisateurRoutes = require("./routes/utilisateurs");
const siegeRoutes = require("./routes/sieges");
const seanceRoutes = require("./routes/seances");
const bodyParser = require("body-parser");
const { initWS } = require("./ws");

app.use(bodyParser.json());
app.use(cors(
    {
        allowedHeaders: '*',
    }
));

app.use("/user", utilisateurRoutes);
app.use("/sieges", siegeRoutes);
app.use("/seances", seanceRoutes);

// Créer un serveur HTTP pour partager le port entre Express et ws
const server = http.createServer(app);

// Attacher le WebSocket au même serveur
initWS(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`);
});
