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

  // Enable the transition only after first paint so it doesn't animate on load.
  requestAnimationFrame(() => {
    body.style.transition = 'max-height 0.3s ease';
  });

  overlay.addEventListener('click', () => {
    const isCollapsed = overlay.dataset.collapsed === 'true';

    if (isCollapsed) {
      body.style.maxHeight = body.scrollHeight + 'px';
      body.classList.remove('collapsed');
      overlay.dataset.collapsed = 'false';
      overlay.querySelector('.overlay-label').textContent = 'Collapse';

      // After transition, remove the max-height constraint so the body
      // can grow freely if the viewport changes.
      body.addEventListener('transitionend', () => {
        if (overlay.dataset.collapsed === 'false') {
          body.style.maxHeight = '';
        }
      }, { once: true });
    } else {
      // Anchor at the current rendered height before transitioning down.
      // If max-height was removed after a previous expand, scrollHeight
      // gives us the full content height to transition from.
      body.style.maxHeight = body.scrollHeight + 'px';
      void body.offsetHeight; // force layout so the browser registers the value
      body.style.maxHeight = collapsedHeight;
      body.classList.add('collapsed');
      overlay.dataset.collapsed = 'true';
      overlay.querySelector('.overlay-label').textContent = 'Expand';
    }
  });
});
