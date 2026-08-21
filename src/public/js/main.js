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

  const contactModal = document.getElementById('contactModal');
  if (contactModal) {
    const openModal = () => {
      contactModal.classList.add('open');
      document.getElementById('contactModalSuccess').style.display = 'none';
      document.getElementById('contactModalError').style.display = 'none';
    };
    const closeModal = () => contactModal.classList.remove('open');

    document.querySelectorAll('[data-open-contact-modal]').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });
    contactModal.querySelectorAll('[data-close-contact-modal]').forEach((btn) => {
      btn.addEventListener('click', closeModal);
    });
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && contactModal.classList.contains('open')) closeModal();
    });

    const form = document.getElementById('contactModalForm');
    const successEl = document.getElementById('contactModalSuccess');
    const errorEl = document.getElementById('contactModalError');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      successEl.style.display = 'none';
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
          body: new URLSearchParams(new FormData(form)),
        });
        const data = await res.json();
        if (data.ok) {
          form.reset();
          successEl.style.display = 'block';
        } else {
          errorEl.textContent = (data.errors && data.errors[0] && data.errors[0].msg) || 'Something went wrong. Please try again.';
          errorEl.style.display = 'block';
        }
      } catch (err) {
        errorEl.textContent = 'Something went wrong. Please try again.';
        errorEl.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
      }
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
