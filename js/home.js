document.addEventListener('DOMContentLoaded', () => {
  const enterLink = document.getElementById('enter-home-btn');
  const toFinder = () => { window.location.href = './index.html'; };

  function onKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); toFinder(); }
  }
  document.addEventListener('keydown', onKeyDown, true);

  if (enterLink) {
    enterLink.addEventListener('pointermove', (e) => {
      const rect = enterLink.getBoundingClientRect();
      const rx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const ry = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      enterLink.style.setProperty('--rx', rx + '%');
      enterLink.style.setProperty('--ry', ry + '%');
    }, { passive: true });
  }
});


