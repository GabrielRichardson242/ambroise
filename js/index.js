function setupImmersive() {
  const body = document.body;
  const enterBtn = document.querySelector('#enter-immersive-btn') || document.querySelector('.cta .btn');
  const isHome = location.pathname.endsWith('index.html') || location.pathname.endsWith('/') || location.pathname === '';

  function enterImmersive() {
    if (!body.hasAttribute('data-immersive')) {
      body.setAttribute('data-immersive', '');
      // No overlay; the UI itself pops in (handled by rooms canvas)
    }
  }

  function exitImmersive() {
    if (body.hasAttribute('data-immersive')) {
      body.removeAttribute('data-immersive');
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      enterImmersive();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      exitImmersive();
    }
  }

  function onKeyUpOrPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  if (isHome) {
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keypress', onKeyUpOrPress, true);
    document.addEventListener('keyup', onKeyUpOrPress, true);
    window.addEventListener('keydown', onKeyDown, true);
  }

  if (enterBtn && isHome) {
    // Cursor-follow highlight
    enterBtn.addEventListener('pointermove', (e) => {
      const rect = enterBtn.getBoundingClientRect();
      const rx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const ry = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      enterBtn.style.setProperty('--rx', rx + '%');
      enterBtn.style.setProperty('--ry', ry + '%');
    }, { passive: true });

    // Enter immersive on click
    enterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      enterImmersive();
    }, true);

    try { enterBtn.blur(); } catch (_) {}
  }

  // Navigation links: cursor-follow highlight like Enter button
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  navLinks.forEach((link) => {
    link.addEventListener('pointermove', (e) => {
      const rect = link.getBoundingClientRect();
      const rx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const ry = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      link.style.setProperty('--rx', rx + '%');
      link.style.setProperty('--ry', ry + '%');
    }, { passive: true });
    link.addEventListener('pointerleave', () => {
      link.style.removeProperty('--rx');
      link.style.removeProperty('--ry');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupImmersive);
} else {
  setupImmersive();
}


