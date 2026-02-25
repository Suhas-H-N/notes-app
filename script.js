const API = 'http://localhost:3000';

let notes = [];
let editingId = null;
let currentCategory = 'all';
let currentSearch = '';
let isListView = false;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(localStorage.getItem('theme') || 'light');
  fetchNotes();
});

// ===== API =====
async function fetchNotes() {
  try {
    const res = await fetch(`${API}/notes`);
    notes = await res.json();
    renderNotes();
    updateStats();
  } catch {
    showToast('⚠️ Could not connect to server');
  }
}

async function saveNoteToServer(note) {
  const method = note.id ? 'PUT' : 'POST';
  const url = note.id ? `${API}/notes/${note.id}` : `${API}/notes`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return res.json();
}

async function deleteNoteFromServer(id) {
  await fetch(`${API}/notes/${id}`, { method: 'DELETE' });
}

// ===== RENDER =====
function renderNotes() {
  const list = document.getElementById('notesList');
  const empty = document.getElementById('emptyState');

  let filtered = notes.filter(n => {
    const matchCat = currentCategory === 'all' || n.category === currentCategory;
    const q = currentSearch.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = filtered.map(n => noteCard(n)).join('');
}

function noteCard(n) {
  const date = new Date(n.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const catLabels = { personal: '🌿 Personal', work: '💼 Work', ideas: '💡 Ideas', important: '⭐ Important' };
  return `
    <div class="note-card ${n.pinned ? 'pinned' : ''}" onclick="openEditModal(${n.id})">
      <div class="card-top">
        <div class="note-title">${escHtml(n.title || 'Untitled')}</div>
        <div class="note-actions">
          <button class="action-btn" title="Pin" onclick="togglePin(event, ${n.id})">${n.pinned ? '📌' : '📍'}</button>
          <button class="action-btn" title="Edit" onclick="openEditModal(${n.id}); event.stopPropagation()">✏️</button>
          <button class="action-btn delete" title="Delete" onclick="deleteNote(event, ${n.id})">🗑</button>
        </div>
      </div>
      <div class="note-body">${escHtml(n.text || '')}</div>
      <div class="card-footer">
        <span class="note-date">${date}</span>
        <span class="note-badge badge-${n.category || 'personal'}">${catLabels[n.category] || '🌿 Personal'}</span>
      </div>
    </div>
  `;
}

function updateStats() {
  document.getElementById('totalCount').textContent = notes.length;
  document.getElementById('pinnedCount').textContent = notes.filter(n => n.pinned).length;
}

// ===== MODAL =====
function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'New Note';
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteText').value = '';
  document.getElementById('noteCategory').value = 'personal';
  document.getElementById('notePin').checked = false;
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('noteTitle').focus(), 100);
}

function openEditModal(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Note';
  document.getElementById('noteTitle').value = note.title || '';
  document.getElementById('noteText').value = note.text || '';
  document.getElementById('noteCategory').value = note.category || 'personal';
  document.getElementById('notePin').checked = !!note.pinned;
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

async function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const text = document.getElementById('noteText').value.trim();
  const category = document.getElementById('noteCategory').value;
  const pinned = document.getElementById('notePin').checked;

  if (!title && !text) {
    showToast('⚠️ Please add a title or some text');
    return;
  }

  const noteData = { title, text, category, pinned };
  if (editingId) noteData.id = editingId;

  try {
    const saved = await saveNoteToServer(noteData);
    if (editingId) {
      notes = notes.map(n => n.id === editingId ? saved : n);
      showToast('✅ Note updated');
    } else {
      notes.unshift(saved);
      showToast('✅ Note created');
    }
    closeModal();
    renderNotes();
    updateStats();
  } catch {
    showToast('❌ Failed to save note');
  }
}

// ===== ACTIONS =====
async function deleteNote(e, id) {
  e.stopPropagation();
  if (!confirm('Delete this note?')) return;
  try {
    await deleteNoteFromServer(id);
    notes = notes.filter(n => n.id !== id);
    renderNotes();
    updateStats();
    showToast('🗑 Note deleted');
  } catch {
    showToast('❌ Failed to delete');
  }
}

async function togglePin(e, id) {
  e.stopPropagation();
  const note = notes.find(n => n.id === id);
  if (!note) return;
  note.pinned = !note.pinned;
  try {
    await saveNoteToServer(note);
    renderNotes();
    updateStats();
    showToast(note.pinned ? '📌 Note pinned' : '📍 Note unpinned');
  } catch {
    showToast('❌ Failed to update');
  }
}

// ===== FILTER =====
function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const titles = { all: 'All Notes', personal: 'Personal', work: 'Work', ideas: 'Ideas', important: 'Important' };
  document.getElementById('topbarTitle').textContent = titles[cat] || 'Notes';
  renderNotes();
}

function searchNotes() {
  currentSearch = document.getElementById('searchInput').value;
  renderNotes();
}

// ===== VIEW TOGGLE =====
function toggleView() {
  isListView = !isListView;
  document.getElementById('notesList').classList.toggle('list-view', isListView);
  document.getElementById('viewToggle').textContent = isListView ? '⊟' : '⊞';
}

// ===== SIDEBAR =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== THEME =====
function toggleTheme() {
  const curr = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(curr === 'dark' ? 'light' : 'dark');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ===== TOAST =====
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== UTILS =====
function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Close sidebar on outside click (mobile)
document.addEventListener('click', e => {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle')) {
      sidebar.classList.remove('open');
    }
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openModal(); }
  if (e.key === 'Escape') closeModal();
});