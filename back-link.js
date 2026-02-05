(() => {
  const back = document.getElementById('back-link');
  if (!back) return;
  const from = new URLSearchParams(window.location.search).get('from');
  const safeLocalPath = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('//') ||
      lower.includes('://')
    ) {
      return '';
    }
    return raw;
  };
  const safeFrom = safeLocalPath(from);
  if (safeFrom) back.href = safeFrom;
})();
