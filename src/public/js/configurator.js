(function () {
  const form = document.getElementById('configureForm');
  const summaryList = document.getElementById('buildSummaryOptions');
  const summaryTotal = document.getElementById('buildSummaryTotal');
  if (!form || !summaryList || !summaryTotal) return;

  const fabricPriceCents = window.__fabricPriceCents || 0;

  function formatEtb(cents) {
    return 'ETB ' + (cents / 100).toLocaleString();
  }

  function render() {
    const radios = form.querySelectorAll('input[type="radio"][data-category]');
    const selectedByCategory = new Map();

    radios.forEach((radio) => {
      if (radio.checked) {
        selectedByCategory.set(radio.dataset.category, radio);
      }
    });

    summaryList.innerHTML = '';
    let optionsTotal = 0;

    selectedByCategory.forEach((radio) => {
      const price = parseInt(radio.dataset.price, 10) || 0;
      optionsTotal += price;

      const li = document.createElement('li');
      li.className = 'build-summary-option';

      const thumbHtml = radio.dataset.image
        ? `<img src="${radio.dataset.image}" alt="${radio.dataset.name}">`
        : `<span class="option-card-thumb-placeholder">${radio.dataset.name.charAt(0)}</span>`;

      li.innerHTML = `
        <span class="build-summary-thumb">${thumbHtml}</span>
        <span class="build-summary-option-info">
          <span class="build-summary-option-category">${radio.dataset.category}</span>
          <span class="build-summary-option-name">${radio.dataset.name}</span>
        </span>
        <span class="build-summary-option-price">${price > 0 ? '+' + formatEtb(price) : 'Included'}</span>
      `;
      summaryList.appendChild(li);
    });

    summaryTotal.textContent = formatEtb(fabricPriceCents + optionsTotal);
  }

  form.addEventListener('change', (e) => {
    if (e.target.matches('input[type="radio"][data-category]')) {
      const card = e.target.closest('.option-card');
      const group = card ? card.closest('.option-scroll') : null;
      if (group) {
        group.querySelectorAll('.option-card').forEach((c) => c.classList.remove('selected'));
        if (card) card.classList.add('selected');
      }
      render();
    }
  });

  form.querySelectorAll('.option-card input:checked').forEach((radio) => {
    const card = radio.closest('.option-card');
    if (card) card.classList.add('selected');
  });

  form.querySelectorAll('.option-scroll-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rail = btn.closest('.option-category').querySelector('.option-scroll');
      if (!rail) return;
      const dir = parseInt(btn.dataset.scrollDir, 10) || 1;
      rail.scrollBy({ left: dir * 300, behavior: 'smooth' });
    });
  });

  render();
})();
