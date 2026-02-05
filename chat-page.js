(() => {
  if (!localStorage.getItem('jwt_access')) {
    window.location.href = 'login.html';
  }
})();
