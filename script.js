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
