(function () {
  const dateInput = document.getElementById('bookingDate');
  const slotGrid = document.getElementById('slotGrid');
  const startsAtInput = document.getElementById('startsAtInput');
  const form = document.getElementById('bookingForm');

  if (!dateInput || !slotGrid) return;

  function fmtTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  async function loadSlots(dateStr) {
    slotGrid.innerHTML = '<p class="hint">Loading available times…</p>';
    startsAtInput.value = '';

    try {
      const res = await fetch(`/api/bookings/availability?date=${encodeURIComponent(dateStr)}`);
      const data = await res.json();

      if (!data.slots || data.slots.length === 0) {
        slotGrid.innerHTML = '<p class="hint">We\'re closed on this date. Please choose another.</p>';
        return;
      }

      slotGrid.innerHTML = '';
      data.slots.forEach((slot) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot-btn';
        btn.dataset.status = slot.status;
        btn.dataset.startsAt = slot.startsAt;
        btn.textContent = fmtTime(slot.startsAt);
        if (slot.status !== 'available') btn.disabled = true;

        btn.addEventListener('click', () => {
          slotGrid.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
          startsAtInput.value = slot.startsAt;
        });

        slotGrid.appendChild(btn);
      });
    } catch (err) {
      slotGrid.innerHTML = '<p class="hint">Could not load availability. Please try again.</p>';
    }
  }

  dateInput.addEventListener('change', () => {
    if (dateInput.value) loadSlots(dateInput.value);
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      if (!startsAtInput.value) {
        e.preventDefault();
        alert('Please select an available time slot.');
      }
    });
  }
})();
