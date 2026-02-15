// Load notes + theme on page start
window.onload = function () {
  loadNotes();

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeToggle").textContent = "☀️";
  }
};

// Add note (frontend only)
function addNote() {
  const noteText = document.getElementById("noteText").value.trim();
  if (noteText === "") return;

  let notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.push(noteText);
  localStorage.setItem("notes", JSON.stringify(notes));

  document.getElementById("noteText").value = "";
  loadNotes();
}

// Load notes from localStorage
function loadNotes() {
  const notesList = document.getElementById("notesList");
  notesList.innerHTML = "";

  let notes = JSON.parse(localStorage.getItem("notes")) || [];

  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.textContent = note;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteNote(index);

    li.appendChild(delBtn);
    notesList.appendChild(li);
  });
}

// Delete note
function deleteNote(index) {
  let notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.splice(index, 1);
  localStorage.setItem("notes", JSON.stringify(notes));
  loadNotes();
}

// Theme toggle
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  const btn = document.getElementById("themeToggle");

  if (isDark) {
    btn.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    btn.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
}
