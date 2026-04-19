// ── SHARED AUTH PAGE UTILITIES ────────────────────────────────────
// Handles dark/light theme for login.html and register.html

(function () {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  document.getElementById('themeBtn').addEventListener('click', () => {
    const curr = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(curr === 'dark' ? 'light' : 'dark');
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
})();
-