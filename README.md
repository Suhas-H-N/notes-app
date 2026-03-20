📝 Notes App (Full Stack)

A full-stack Notes Application built using HTML, CSS, JavaScript, Node.js, Express, and MongoDB.
This app allows users to create, view, and delete notes with persistent storage in a database.

The project demonstrates frontend + backend integration, REST APIs, and database connectivity.

🚀 Features

✅ Create notes
✅ Delete notes
✅ Persistent storage using MongoDB
✅ Responsive and modern UI
✅ Dark / Light theme toggle 🌙☀️
✅ Notes stored with timestamp
✅ REST API backend
✅ Full stack architecture

🛠 Tech Stack

Frontend:
HTML
CSS
JavaScript

Backend:
Node.js
Express.js

Database:
MongoDB
Mongoose

Tools:
Git
GitHub
VS Code

📂 Project Structure

notes-app
│
├── index.html
├── login.html
├── style.css
├── script.js
├── package.json
├── package-lock.json
├── .gitignore
│
└── notes-app-backend
    ├── server.js
    ├── package.json
    └── node_modules

⚙️ Installation

Clone the repository:
git clone https://github.com/your-username/notes-app.git

Navigate to backend folder:
cd notes-app-backend

Install dependencies:
npm install

▶️ Running the Application

1️⃣ Start MongoDB
Open terminal and run:
mongod

2️⃣ Start Backend Server
Inside backend folder:
node server.js

You should see:
MongoDB Connected
Server running at http://localhost:3000

3️⃣ Run Frontend
Open index.html or login.html using Live Server or directly in browser.

Example:
http://localhost:5500/login.html

📡 API Endpoints
Get all notes
GET /notes
Add note
POST /notes

Body:

{
"title": "My Note",
"text": "This is a note"
}
Delete note
DELETE /notes/:id

💾 Database

MongoDB stores notes in a collection:
notesDB

Each note contains:
title
text
createdAt

📸 Example Note
Title: Meeting Notes
Text: Discuss project progress
Time: 18 Feb 2026

🔮 Future Improvements

User authentication system 🔐
Edit notes feature ✏️
Search notes 🔎
Tags / categories
Deploy to cloud

👨‍💻 Author
Suhas H N

GitHub:
https://github.com/Suhas-H-N