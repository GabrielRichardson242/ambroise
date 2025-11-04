document.addEventListener('DOMContentLoaded', () => {
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const path = location.pathname.split('/').pop();
  links.forEach((a) => {
    const isActive = a.getAttribute('href').endsWith(path) || (path === '' && a.getAttribute('href').endsWith('index.html'));
    if (isActive) a.setAttribute('data-active', '');
  });
});


