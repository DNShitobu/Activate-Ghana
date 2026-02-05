(() => {
  const isAuthed = Boolean(localStorage.getItem('jwt_access'));
  document.querySelectorAll('.auth-only').forEach(el => {
    el.classList.toggle('hidden', !isAuthed);
  });
  const banner = document.getElementById('login-banner');
  if (banner) banner.classList.toggle('hidden', isAuthed);
  document.querySelectorAll('.auth-required').forEach(el => {
    el.addEventListener('click', (e) => {
      if (!isAuthed) {
        e.preventDefault();
        window.location.href = 'login.html';
      }
    });
  });
})();
