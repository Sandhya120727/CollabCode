# CollabCode — Real-Time Collaborative Code Editor (MERN Stack)

A production-quality real-time collaborative code editor built with:
- **MongoDB** — persistent room/code storage
- **Express.js** — REST API
- **React.js** — frontend UI with Monaco Editor
- **Node.js** — server runtime
- **Socket.io** — real-time collaboration

## Features
- 🔴 Live code sync across all users in a room
- 🌍 18+ language support (JS, Python, Go, Rust, Java…)
- 💬 Built-in team chat
- 👥 Live user presence sidebar
- 🔗 Shareable room links
- 💾 Auto-save to MongoDB
- 🎨 Monaco Editor (VSCode's editor engine)

---

## Project Structure

```
collaborative-code-editor/
├── server/
│   ├── package.json
│   ├── server.js          ← Express + Socket.io backend
│   ├── .env.example       ← Copy this to .env
│   └── models/
│       └── Room.js        ← MongoDB schema
└── client/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js
        ├── index.css
        ├── socket.js      ← Socket.io client singleton
        └── components/
            ├── Home.jsx       ← Landing/join page
            ├── EditorPage.jsx ← Main editor room
            └── Editor.jsx     ← Monaco editor wrapper
```

---

## Setup Instructions (macOS)

### Prerequisites
1. **Homebrew** (macOS package manager)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Node.js** (v18 or later)
   ```bash
   brew install node
   node --version   # should show v18+
   ```

3. **MongoDB Community Edition**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community@7.0
   brew services start mongodb-community@7.0
   ```

---

### Step 1 — Configure the server
```bash
cd server
cp .env.example .env
# .env is ready to go with default values
```

### Step 2 — Install server dependencies
```bash
cd server
npm install
```

### Step 3 — Install client dependencies
```bash
cd ../client
npm install
```

### Step 4 — Run the server
```bash
cd server
npm run dev
# Server starts at http://localhost:5000
```

### Step 5 — Run the client (new terminal tab)
```bash
cd client
npm start
# React app opens at http://localhost:3000
```

---

## Usage

1. Open `http://localhost:3000` in your browser
2. Enter your name and click **Create New Room**
3. Copy the Room ID from the sidebar
4. Open another browser tab (or share with a friend) → paste the Room ID → Join
5. Start coding together! Changes sync in real-time.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MongoDB not connecting | Run `brew services start mongodb-community@7.0` |
| Port 5000 in use | Change `PORT=5001` in `server/.env` |
| Port 3000 in use | React will prompt you to use another port — press Y |
| npm install fails | Try `npm install --legacy-peer-deps` |
