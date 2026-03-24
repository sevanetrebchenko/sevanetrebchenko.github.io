/**
 * Client-side code block interactivity:
 *  - Copy to clipboard
 *  - Expand/collapse for show-lines
 */

function initCodeBlocks() {
  // --- Copy to clipboard ---
  document.querySelectorAll('.copy-button[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const container = button.closest('.code-container');
      if (!container) return;

      const codeEl = container.querySelector('pre code');
      if (!codeEl) return;

      // Get text content (excludes gutter since it's outside pre)
      const text = codeEl.textContent || '';

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      // Show "Copied!" feedback
      const svg = button.querySelector('svg');
      if (svg) svg.style.display = 'none';

      const label = document.createElement('span');
      label.className = 'copied-label';
      label.textContent = 'Copied!';
      button.appendChild(label);

      setTimeout(() => {
        label.classList.add('fade-out');
        setTimeout(() => {
          label.remove();
          if (svg) svg.style.display = '';
        }, 300);
      }, 1000);
    });
  });

  // --- Expand/collapse ---
  document.querySelectorAll('.code-container[data-show-lines]').forEach((container) => {
    const showLines = parseInt(container.dataset.showLines, 10);
    if (!showLines || showLines <= 0) return;

    const codeBody = container.querySelector('.code-body');
    const overlay = container.querySelector('.code-overlay');
    if (!codeBody || !overlay) return;

    // Measure line height from an actual line element
    const firstLine = codeBody.querySelector('.line');
    if (!firstLine) return;

    const lineHeight = firstLine.getBoundingClientRect().height || parseFloat(getComputedStyle(firstLine).lineHeight);
    const padding = 36; // 18px top + 18px bottom padding on code-body
    const collapsedHeight = lineHeight * showLines + padding;

    // Only collapse if the content is actually taller than the limit
    if (codeBody.scrollHeight <= collapsedHeight + lineHeight) {
      // Content fits — remove overlay
      overlay.remove();
      return;
    }

    // Set initial collapsed state
    codeBody.style.maxHeight = collapsedHeight + 'px';
    codeBody.style.overflow = 'hidden';

    overlay.addEventListener('click', () => {
      const isCollapsed = overlay.dataset.collapsed === 'true';

      if (isCollapsed) {
        codeBody.style.maxHeight = codeBody.scrollHeight + 'px';
        overlay.dataset.collapsed = 'false';
        overlay.querySelector('.overlay-label').textContent = 'Show less';
      } else {
        codeBody.style.maxHeight = collapsedHeight + 'px';
        overlay.dataset.collapsed = 'true';
        overlay.querySelector('.overlay-label').textContent = 'Show more';
      }
    });
  });
}

// Run on initial load
initCodeBlocks();

// Re-run after Astro view transitions (if used)
document.addEventListener('astro:page-load', initCodeBlocks);
