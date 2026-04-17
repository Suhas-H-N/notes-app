// ─────────────────────────────────────────────────────────────────
// Notely — Frontend Application
// ─────────────────────────────────────────────────────────────────

const API = 'http://localhost:3000';

let notes          = [];
let editingId      = null;
let currentCategory = 'all';
let currentSearch  = '';
let isListView     = false;
let pendingDeleteId = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Auth guard — redirect to login if no token
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  applyTheme(localStorage.getItem('theme') || 'light');

  // Show user name in sidebar
  const name = localStorage.getItem('userName');
  if (name) document.getElementById('userGreeting').textContent = name;

  fetchNotes();
  initCharCount();
});

// ===== AUTH HELPERS =====
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  };
}

function handleAuthError(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  window.location.href = 'login.html';
}

// ===== API =====
async function fetchNotes() {
  try {
    const res = await fetch(`${API}/notes`, { headers: getAuthHeaders() });
    if (handleAuthError(res)) return;
    if (!res.ok) throw new Error(await res.text());
    notes = await res.json();
    renderNotes();
    updateStats();
  } catch {
    showToast('⚠️ Could not connect to server');
  }
}

async function saveNoteToServer(note) {
  const method = note._id ? 'PUT' : 'POST';
  const url    = note._id ? `${API}/notes/${note._id}` : `${API}/notes`;
  const res    = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(note),
  });
  if (handleAuthError(res)) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Save failed');
  }
  return res.json();
}

async function deleteNoteFromServer(id) {
  const res = await fetch(`${API}/notes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (handleAuthError(res)) return;
  if (!res.ok) throw new Error('Delete failed');
}

// ===== RENDER =====
function renderNotes() {
  const list  = document.getElementById('notesList');
  const empty = document.getElementById('emptyState');

  let filtered = notes.filter(n => {
    const matchCat    = currentCategory === 'all' || n.category === currentCategory;
    const q           = currentSearch.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Pinned notes always at top (server already sorts, but keeps client-side consistent)
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
  const date = new Date(n.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const catLabels = {
    personal:  '🌿 Personal',
    work:      '💼 Work',
    ideas:     '💡 Ideas',
    important: '⭐ Important',
  };
  const id       = n._id;
  const preview  = n.text ? escHtml(n.text).slice(0, 200) : '';

  return `
    <div class="note-card ${n.pinned ? 'pinned' : ''}" onclick="openEditModal('${id}')" role="article" aria-label="${escHtml(n.title || 'Untitled note')}">
      <div class="card-top">
        <div class="note-title">${escHtml(n.title || 'Untitled')}</div>
        <div class="note-actions" role="group" aria-label="Note actions">
          <button class="action-btn" title="${n.pinned ? 'Unpin' : 'Pin'}" onclick="togglePin(event,'${id}')" aria-label="${n.pinned ? 'Unpin note' : 'Pin note'}">${n.pinned ? '📌' : '📍'}</button>
          <button class="action-btn" title="Edit" onclick="openEditModal('${id}'); event.stopPropagation()" aria-label="Edit note">✏️</button>
          <button class="action-btn delete" title="Delete" onclick="confirmDelete(event,'${id}')" aria-label="Delete note">🗑</button>
        </div>
      </div>
      ${preview ? `<div class="note-body">${preview}</div>` : ''}
      <div class="card-footer">
        <span class="note-date">${date}</span>
        <span class="note-badge badge-${n.category || 'personal'}">${catLabels[n.category] || '🌿 Personal'}</span>
      </div>
    </div>
  `;
}

function updateStats() {
  document.getElementById('totalCount').textContent  = notes.length;
  document.getElementById('pinnedCount').textContent = notes.filter(n => n.pinned).length;
}

// ===== MODAL =====
function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent        = 'New Note';
  document.getElementById('noteTitle').value               = '';
  document.getElementById('noteText').value                = '';
  document.getElementById('noteCategory').value            = 'personal';
  document.getElementById('notePin').checked               = false;
  document.getElementById('charCount').textContent         = '0 characters';
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('noteTitle').focus(), 100);
}

function openEditModal(id) {
  const note = notes.find(n => n._id === id);
  if (!note) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Note';
  document.getElementById('noteTitle').value        = note.title    || '';
  document.getElementById('noteText').value         = note.text     || '';
  document.getElementById('noteCategory').value     = note.category || 'personal';
  document.getElementById('notePin').checked        = !!note.pinned;
  updateCharCount(note.text || '');
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

async function saveNote() {
  const title    = document.getElementById('noteTitle').value.trim();
  const text     = document.getElementById('noteText').value.trim();
  const category = document.getElementById('noteCategory').value;
  const pinned   = document.getElementById('notePin').checked;

  if (!title && !text) {
    showToast('⚠️ Please add a title or some content');
    return;
  }

  const noteData = { title, text, category, pinned };
  if (editingId) noteData._id = editingId;

  const saveBtn = document.querySelector('.btn-save');
  saveBtn.textContent = 'Saving…';
  saveBtn.disabled    = true;

  try {
    const saved = await saveNoteToServer(noteData);
    if (!saved) return; // redirected by auth handler

    if (editingId) {
      notes = notes.map(n => n._id === editingId ? saved : n);
      showToast('✅ Note updated');
    } else {
      notes.unshift(saved);
      showToast('✅ Note created');
    }
    closeModal();
    renderNotes();
    updateStats();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  } finally {
    saveBtn.textContent = 'Save Note';
    saveBtn.disabled    = false;
  }
}

// ===== CONFIRM DELETE =====
function confirmDelete(e, id) {
  e.stopPropagation();
  pendingDeleteId = id;
  document.getElementById('confirmOverlay').classList.add('open');
  document.getElementById('confirmDeleteBtn').onclick = () => executeDelete();
}

function closeConfirm() {
  pendingDeleteId = null;
  document.getElementById('confirmOverlay').classList.remove('open');
}

async function executeDelete() {
  if (!pendingDeleteId) return;
  closeConfirm();
  try {
    await deleteNoteFromServer(pendingDeleteId);
    notes = notes.filter(n => n._id !== pendingDeleteId);
    renderNotes();
    updateStats();
    showToast('🗑 Note deleted');
  } catch {
    showToast('❌ Failed to delete note');
  }
  pendingDeleteId = null;
}

// ===== ACTIONS =====
async function togglePin(e, id) {
  e.stopPropagation();
  const note = notes.find(n => n._id === id);
  if (!note) return;
  const updated = { ...note, pinned: !note.pinned };
  try {
    const saved = await saveNoteToServer(updated);
    if (!saved) return;
    notes = notes.map(n => n._id === id ? saved : n);
    renderNotes();
    updateStats();
    showToast(saved.pinned ? '📌 Note pinned' : '📍 Note unpinned');
  } catch {
    showToast('❌ Failed to update note');
  }
}

// ===== FILTER & SEARCH =====
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

// Close sidebar on outside click (mobile)
document.addEventListener('click', e => {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle')) {
      sidebar.classList.remove('open');
    }
  }
});

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

// ===== CHAR COUNT =====
function initCharCount() {
  document.getElementById('noteText').addEventListener('input', function () {
    updateCharCount(this.value);
  });
}

function updateCharCount(text) {
  document.getElementById('charCount').textContent = `${text.length} character${text.length !== 1 ? 's' : ''}`;
}

// ===== TOAST =====
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ===== UTILS =====
function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    openModal();
  }
  if (e.key === 'Escape') {
    closeModal();
    closeConfirm();
  }
});
