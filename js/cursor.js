// Ambroise custom cursor: bracket style with click burst (desktop only)
document.addEventListener('DOMContentLoaded', () => {
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) return;

  const root = document.createElement('div');
  root.id = 'ambroise-cursor';
  root.innerHTML = [
    '<div class="amb-core"></div>',
    '<div class="amb-bracket tl"></div>',
    '<div class="amb-bracket tr"></div>',
    '<div class="amb-bracket bl"></div>',
    '<div class="amb-bracket br"></div>',
    '<div class="amb-burst"></div>'
  ].join('');
  document.body.appendChild(root);

  let x = window.innerWidth * 0.5;
  let y = window.innerHeight * 0.5;
  let tx = x, ty = y;
  let raf = 0;

  function onMove(e) {
    tx = e.clientX; ty = e.clientY;
    root.removeAttribute('data-hidden');
  }
  function onLeave() { root.setAttribute('data-hidden', ''); }
  function onDown() { root.setAttribute('data-click', ''); setTimeout(() => root.removeAttribute('data-click'), 260); }

  function tick() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    root.style.transform = `translate(${x}px, ${y}px)`;
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mousedown', onDown);
  window.addEventListener('mouseleave', onLeave);
  raf = requestAnimationFrame(tick);
});


