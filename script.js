const API_URL = "http://localhost:3000/notes";

// ➕ Add Note
async function addNote() {
  try {
    const title = document.getElementById("noteTitle").value.trim();
    const text = document.getElementById("noteText").value.trim();

    if (title === "" || text === "") {
      alert("Please fill in both title and note!");
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text })
    });

    if (!res.ok) throw new Error("Failed to add note");

    document.getElementById("noteTitle").value = "";
    document.getElementById("noteText").value = "";
    loadNotes();

  } catch (err) {
    console.error("ADD NOTE ERROR:", err);
    alert("Error adding note. Check console.");
  }
}

// 📄 Load Notes
async function loadNotes() {
  const res = await fetch(API_URL);
  const notes = await res.json();

  const notesList = document.getElementById("notesList");
  notesList.innerHTML = "";

  if (notes.length === 0) {
    notesList.innerHTML = `<p style="text-align:center; color:#aaa;">No notes yet. Add one! 📝</p>`;
    return;
  }

  notes.forEach((note) => {
    const li = document.createElement("li");

    const date = new Date(note.createdAt);
    const formattedDate = date.toLocaleString();

    li.innerHTML = `
      <div class="note-title">${note.title}</div>
      <div class="note-body">${note.text}</div>
      <div class="note-timestamp">🕒 ${formattedDate}</div>
      <div class="note-footer">
        <button onclick="deleteNote('${note._id}')">🗑 Delete</button>
      </div>
    `;

    notesList.appendChild(li);
  });
}

// 🗑 Delete Note
async function deleteNote(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  loadNotes();
}

// 🌙 Theme Toggle
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  const btn = document.getElementById("themeToggle");
  btn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// 🚀 On Load
window.onload = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeToggle").textContent = "☀️";
  }
  loadNotes();
};