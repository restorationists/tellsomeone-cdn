  (function () {
    const btn = document.getElementById('menuBtn');
    const menu = document.getElementById('mobileMenu');

    if (!btn || !menu) return;

    function toggleMenu(force) {
      const isOpen = typeof force === 'boolean' ? !force : menu.classList.contains('hidden');
      menu.classList.toggle('hidden', !isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      // swap icon
      const icon = btn.querySelector('.iconify');
      if (icon) icon.setAttribute('data-icon', isOpen ? 'mdi:close' : 'mdi:menu');
      // lock scroll when open
      document.documentElement.classList.toggle('overflow-hidden', isOpen);
    }

    btn.addEventListener('click', () => toggleMenu());
    // close on Escape
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(true); });
    // close when clicking a link
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) toggleMenu(true);
    });
  })();