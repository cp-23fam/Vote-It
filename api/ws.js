const { WebSocketServer, WebSocket } = require("ws");
const db = require("./db");

let wss = null;

/**
 * Initialise le serveur WebSocket sur le serveur HTTP existant
 * @param {import('http').Server} server
 */
function initWS(server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    ws.role = null; // 'president' | 'room' | 'mobile'
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === "IDENTIFY") {
          ws.role = msg.role ?? null;
        }
      } catch (_) {
        /* ignore mal-formed */
      }
    });

    ws.on("error", () => {});

    // Envoyer l'état courant au nouveau client
    try {
      await sendRoomState(ws);
    } catch (e) {
      console.error("WS: sendRoomState error", e.message);
    }
  });

  // Heartbeat toutes les 30s pour détecter les connexions mortes
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));

  console.log("✅ WebSocket server ready on /ws");
}

/**
 * Envoie l'état courant (vote actif + sièges) à un client qui vient de se connecter
 */
async function sendRoomState(ws) {
  const { rows: seances } = await db.query(
    `SELECT * FROM seance WHERE fin_seance > NOW() ORDER BY fin_seance DESC LIMIT 1`,
  );
  const vote = seances[0] ?? null;

  let seats = {};
  let results = { oui: 0, non: 0, neutre: 0 };

  if (vote) {
    const { rows: sieges } = await db.query(
      `SELECT s.place, u.nom, u.prenom, s.vote
       FROM siege s
       JOIN utilisateur u ON u.id = s.id_utilisateur
       WHERE s.id_seance = ?`,
      [vote.id],
    );

    sieges.forEach((s) => {
      seats[s.place] = { name: `${s.prenom} ${s.nom}`, vote: s.vote };
      if (s.vote) results[s.vote] = (results[s.vote] ?? 0) + 1;
    });
  }

  send(ws, {
    type: "ROOM_STATE",
    vote: vote ? { id: vote.id, title: vote.question } : null,
    seats,
    results,
  });
}

/**
 * Diffuse un message à tous les clients connectés (ou filtrés par rôle)
 * @param {object} payload
 * @param {string|null} onlyRole  - si fourni, n'envoie qu'aux clients de ce rôle
 */
function broadcast(payload, onlyRole = null) {
  if (!wss) return;
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;
    if (onlyRole && client.role !== onlyRole) return;
    client.send(data);
  });
}

/**
 * Envoie un message à un client unique
 */
function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

/**
 * Notifie tous les clients qu'un vote vient de démarrer
 */
function notifyVoteStarted(vote) {
  broadcast({
    type: "VOTE_STARTED",
    vote_id: vote.id,
    title: vote.question,
    fin_seance: vote.fin_seance,
  });
}

/**
 * Notifie tous les clients qu'un siège vient de s'attribuer
 */
function notifySeatJoined(place, utilisateur, seanceId) {
  broadcast({
    type: "SEAT_JOINED",
    seat_id: place,
    name: `${utilisateur.prenom} ${utilisateur.nom}`,
    vote_id: seanceId,
  });
}

/**
 * Notifie tous les clients d'un vote posé sur un siège
 */
async function notifySeatVoted(place, vote, seanceId) {
  // Recalcule les résultats depuis la BDD pour être sûr
  const { rows } = await db.query(
    `SELECT vote, COUNT(*) as nb
     FROM siege
     WHERE id_seance = ? AND vote IS NOT NULL
     GROUP BY vote`,
    [seanceId],
  );
  const results = { oui: 0, non: 0, neutre: 0 };
  rows.forEach((r) => {
    results[r.vote] = Number(r.nb);
  });

  broadcast({
    type: "SEAT_VOTED",
    seat_id: place,
    vote,
    vote_id: seanceId,
    results,
  });
}

/**
 * Notifie tous les clients que le vote est fermé
 */
async function notifyVoteClosed(seanceId) {
  const { rows } = await db.query(
    `SELECT vote, COUNT(*) as nb
     FROM siege
     WHERE id_seance = ? AND vote IS NOT NULL
     GROUP BY vote`,
    [seanceId],
  );
  const results = { oui: 0, non: 0, neutre: 0 };
  rows.forEach((r) => {
    results[r.vote] = Number(r.nb);
  });

  broadcast({ type: "VOTE_CLOSED", vote_id: seanceId, results });
}

module.exports = {
  initWS,
  broadcast,
  notifyVoteStarted,
  notifySeatJoined,
  notifySeatVoted,
  notifyVoteClosed,
};
