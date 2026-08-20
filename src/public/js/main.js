document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  document.querySelectorAll('.dropdown-toggle').forEach((toggle) => {
    const menu = toggle.nextElementSibling;
    if (!menu) return;
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !menu.classList.contains('open');
      document.querySelectorAll('.dropdown-menu.open').forEach((m) => m.classList.remove('open'));
      if (willOpen) menu.classList.add('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.open').forEach((m) => m.classList.remove('open'));
  });

  const stickyCta = document.getElementById('stickyBookCta');
  if (stickyCta) {
    const reveal = () => {
      if (window.scrollY > 420) {
        stickyCta.classList.add('visible');
      } else {
        stickyCta.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', reveal, { passive: true });
    reveal();
  }
});
