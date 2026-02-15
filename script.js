function addNote() {
  const noteText = document.getElementById("noteText").value;

  if (noteText === "") return;

  const li = document.createElement("li");
  li.textContent = noteText;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";

  deleteBtn.onclick = function () {
    li.remove();
  };

  li.appendChild(deleteBtn);
  document.getElementById("notesList").appendChild(li);

  document.getElementById("noteText").value = "";
}

// Load saved theme on start
window.onload = function () {
  showNotes();

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeToggle").textContent = "☀️";
  }
};

// Toggle theme when icon clicked
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

