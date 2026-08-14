document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

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
