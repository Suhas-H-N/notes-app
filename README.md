# ✦ Notely — Full-Stack Notes Application

A full-stack notes app built with **HTML · CSS · JavaScript · Node.js · Express · MongoDB**.

---

## 🗂 Project Structure

```
notely/
├── frontend/          ← Open with VS Code Live Server
│   ├── index.html     ← Main app (notes dashboard)
│   ├── login.html     ← Sign in page
│   ├── register.html  ← Sign up page  (NEW)
│   ├── script.js      ← App logic (JWT-authenticated API calls)
│   ├── style.css      ← Main app styles
│   ├── auth.css       ← Shared auth page styles  (NEW)
│   └── auth.js        ← Shared theme logic for auth pages  (NEW)
│
└── backend/           ← Node.js REST API
    ├── server.js      ← Express app with JWT auth middleware
    ├── package.json
    ├── .env.example   ← Copy to .env and fill values  (NEW)
    └── .gitignore
```

---

## ⚙️ Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, PORT
npm run dev               # starts with nodemon
```

You should see:
```
✅ MongoDB connected
✦ Notely server running at http://localhost:3000
```

### 2. Frontend

Open `frontend/` in VS Code and launch `login.html` with **Live Server**.

```
http://localhost:5500/login.html
```

---

## 📡 API Endpoints

| Method | Endpoint      | Auth | Description         |
|--------|---------------|------|---------------------|
| POST   | /register     | No   | Create account      |
| POST   | /login        | No   | Sign in, get JWT    |
| GET    | /notes        | Yes  | Get all your notes  |
| GET    | /notes/:id    | Yes  | Get one note        |
| POST   | /notes        | Yes  | Create note         |
| PUT    | /notes/:id    | Yes  | Update note         |
| DELETE | /notes/:id    | Yes  | Delete note         |

Protected routes require: `Authorization: Bearer <token>`

---

## ✅ Features

- Create, edit, delete, and pin notes
- 4 categories: Personal, Work, Ideas, Important
- Live search + category filter
- Grid / List view toggle
- Dark / Light theme (persisted)
- JWT authentication (login + register)
- Secure password hashing with bcrypt
- Keyboard shortcuts: `Ctrl+N` new note, `Esc` close modal
- Fully responsive (mobile sidebar)

---

## 👤 Author

**Suhas H N** — [github.com/Suhas-H-N](https://github.com/Suhas-H-N)
