# Vote It — President Panel

Vue 3 frontend for the president/moderator of a real-time vote-it voting system.

## Stack

- **Vue 3** (Composition API + `<script setup>`)
- **Vue Router 4** — client-side routing with navigation guards
- **Pinia** — state management (auth + vote stores)
- **Chart.js + vue-chartjs** — bar and doughnut result charts
- **Native WebSocket** — real-time vote updates from the server

## Getting Started

```bash
npm install
npm run dev        # dev server on :5173 (proxies /api and /ws to :3000)
npm run build      # production build
```

## Project Structure

```
src/
├── main.js
├── App.vue
├── style.css               # design tokens (CSS variables)
├── router/
│   └── index.js            # routes + auth guard
├── stores/
│   ├── auth.js             # login / logout / JWT
│   └── vote.js             # vote lifecycle + WebSocket
├── views/
│   ├── LoginView.vue       # /login
│   ├── LayoutView.vue      # persistent shell (sidebar)
│   ├── DashboardView.vue   # /
│   ├── NewVoteView.vue     # /vote/new
│   ├── ActiveVoteView.vue  # /vote/:id
│   ├── VoteResultsView.vue # /vote/:id/results
│   └── HistoryView.vue     # /history
└── components/
    └── TimerDisplay.vue    # countdown ring
```

## API Contract Expected from Backend

### Auth

```
POST /api/auth/login
  Body: { username, password, role: "president" }
  Response: { token, user: { id, username } }
```

### Votes

```
GET  /api/votes/active
  Response: { vote } | 404

POST /api/votes
  Body: { title, description?, options[], duration?, anonymous }
  Response: { vote }

POST /api/votes/:id/close
  Response: { vote }

GET  /api/votes/:id
  Response: { vote }

GET  /api/votes/history
  Response: { votes[] }
```

### Vote object shape

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "options": ["For", "Against", "Abstain"],
  "status": "open | closed",
  "duration": 120,
  "anonymous": false,
  "eligible_voters": 42,
  "connected_voters": 38,
  "results": { "For": 20, "Against": 15, "Abstain": 3 },
  "started_at": "ISO8601",
  "closed_at": "ISO8601"
}
```

## WebSocket Protocol

Connect: `ws://host/ws?token=<jwt>`

### Server → Client messages

```json
{ "type": "VOTE_UPDATE", "vote_id": "...", "results": {...}, "voter_count": 35 }
{ "type": "VOTE_CLOSED", "vote_id": "...", "results": {...} }
{ "type": "VOTER_JOINED", "count": 38 }
```

### Client → Server

```json
{ "type": "IDENTIFY", "role": "president" }
```

## Notes & Design Decisions

- The timer is purely client-side after receiving `started_at` from the server.
  If you need strict server-authoritative timing, add a `TICK` WS message.
- `eligible_voters` comes from the backend (list of registered members),
  not counted client-side.
- The president view does NOT allow voting — it is read-only + control only.
- On reconnect, `fetchActiveVote()` is called to resync state and remaining time.
