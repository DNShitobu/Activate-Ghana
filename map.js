(() => {
  if (!localStorage.getItem('jwt_access')) {
    window.location.href = 'login.html';
    return;
  }

  const map = L.map('map').setView([5.6037, -0.1870], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);

  const experts = [
    { name: 'Ama Boateng', coords: [5.67, -0.15] },
    { name: 'Kofi Mensah', coords: [6.69, -1.62] },
    { name: 'Esi Quaye', coords: [5.63, -0.09] },
  ];
  const jobs = [
    { title: 'Wire apartment', coords: [5.55, -0.22] },
    { title: 'Retile bathroom', coords: [5.11, -1.25] },
  ];

  experts.forEach(e => L.marker(e.coords, {
    icon: L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', iconSize: [24, 24] }),
  }).addTo(map).bindPopup(e.name));
  jobs.forEach(j => L.marker(j.coords, {
    icon: L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/1904116.png', iconSize: [24, 24] }),
  }).addTo(map).bindPopup(j.title));

  const nearMe = document.getElementById('near-me');
  if (nearMe) {
    nearMe.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
      }
      navigator.geolocation.getCurrentPosition(pos => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 12);
        L.circle([pos.coords.latitude, pos.coords.longitude], { radius: 5000, color: 'blue' }).addTo(map);
      });
    });
  }
})();
