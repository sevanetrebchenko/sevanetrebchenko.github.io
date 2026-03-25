// Copy to clipboard
document.querySelectorAll('.copy-button').forEach(btn => {
  let timeout = null;

  btn.addEventListener('click', async () => {
    const container = btn.closest('.code-container');
    const text = Array.from(container.querySelectorAll('.line-content'))
      .map(el => el.textContent)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }

    btn.classList.add('copied');
    clearTimeout(timeout);
    timeout = setTimeout(() => btn.classList.remove('copied'), 1500);
  });
});

// Expand / collapse
document.querySelectorAll('.code-overlay').forEach(overlay => {
  const body            = overlay.previousElementSibling;
  const collapsedHeight = body.dataset.collapsedHeight;

  overlay.addEventListener('click', () => {
    const isCollapsed = overlay.dataset.collapsed === 'true';

    // Suppress hover until fade transition completes and mouse moves
    overlay.classList.add('no-hover');
    setTimeout(() => {
      document.addEventListener('mousemove', () => overlay.classList.remove('no-hover'), { once: true });
    }, 350);

    if (isCollapsed) {
      body.style.maxHeight = '';
      body.classList.remove('collapsed');
      overlay.dataset.collapsed = 'false';
      overlay.querySelector('.overlay-label').textContent = overlay.dataset.showLess;
    } else {
      body.style.maxHeight = collapsedHeight;
      body.classList.add('collapsed');
      body.querySelector('.code-scroll').scrollLeft = 0;
      overlay.dataset.collapsed = 'true';
      overlay.querySelector('.overlay-label').textContent = overlay.dataset.showMore;
    }
  });
});
