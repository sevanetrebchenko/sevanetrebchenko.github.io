import rangeParser from 'parse-numeric-range';

function h(tag, props, children) {
  return { type: 'element', tagName: tag, properties: props || {}, children: children || [] };
}

function t(value) {
  return { type: 'text', value: String(value) };
}

function raw(html) {
  return { type: 'raw', value: html };
}

function hasClass(node, cls) {
  const c = node.properties?.class ?? node.properties?.className;
  if (!c) return false;
  if (Array.isArray(c)) return c.includes(cls);
  return c.split(/\s+/).includes(cls);
}

const COPY_ICON  = '<svg class="btn-icon copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>';
const CHECK_ICON = '<svg class="btn-icon check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const CHEVRON    = '<svg class="overlay-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';

export function metaTransformer() {
  return {
    name: 'shiki-meta-transformer',

    preprocess(code, options) {
      const meta = options.meta?.__raw ?? '';
      const get  = (pattern) => (pattern.exec(meta) || [])[1] ?? null;

      this._title     = null;
      this._added     = rangeParser(get(/\badded\b:\{([^}]+)\}/)   ?? '');
      this._removed   = rangeParser(get(/\bremoved\b:\{([^}]+)\}/) ?? '');
      this._lineNums  = /\bline-numbers\b:\{enabled?\}/i.test(meta);
      this._showLines = Number(get(/\bshow-lines\b:\{(\d+)\}/))    || null;
      this._hidden    = rangeParser(get(/\bhidden\b:\{([^}]+)\}/)  ?? '');
      this._noCopy    = /\bno-copy\b/.test(meta);
      this._lang      = options.lang || null;
    },

    root(hast) {
      const pre    = hast.children.find(n => n.type === 'element' && n.tagName === 'pre');
      if (!pre) return;
      const codeEl = pre.children?.find(n => n.type === 'element' && n.tagName === 'code');
      if (!codeEl) return;

      // Collect span.line elements
      let allLines = (codeEl.children || []).filter(n => n.type === 'element' && hasClass(n, 'line'));

      // Shiki adds a trailing empty line for a trailing newline — drop it
      if (allLines.length > 0) {
        const last  = allLines[allLines.length - 1];
        const blank = last.children.length === 0 ||
          (last.children.length === 1 && last.children[0].type === 'text' && last.children[0].value === '');
        if (blank) allLines.pop();
      }

      // Filter hidden lines, preserving original 1-based index for diff state lookup
      const visible = allLines
        .map((el, i) => ({ el, orig: i + 1 }))
        .filter(({ orig }) => !this._hidden.includes(orig));

      const hasDiff   = this._added.length > 0 || this._removed.length > 0;
      const hasGutter = this._lineNums || hasDiff;

      // Build rows
      const rows = visible.map(({ el, orig }, idx) => {
        const isAdded   = this._added.includes(orig);
        const isRemoved = this._removed.includes(orig);

        const rowClass = isAdded   ? 'code-row line-added'
                       : isRemoved ? 'code-row line-removed'
                       : 'code-row';

        const children = [];

        if (hasGutter) {
          const gc = [];

          if (this._lineNums) {
            gc.push(h('span', { class: 'gutter-number' }, [t(idx + 1)]));
          }

          if (hasDiff) {
            const sym = isAdded ? '+' : isRemoved ? '-' : '\u00a0';
            const cls = isAdded   ? 'gutter-diff diff-add'
                      : isRemoved ? 'gutter-diff diff-remove'
                      : 'gutter-diff';
            gc.push(h('span', { class: cls }, [t(sym)]));
          }

          gc.push(h('div', { class: 'gutter-separator' }, []));
          gc.push(h('div', { class: 'gutter-spacer' },    []));
          children.push(h('div', { class: 'gutter-cell' }, gc));
        }

        children.push(h('div', { class: 'line-content' }, el.children));

        return h('div', { class: rowClass }, children);
      });

      // Rows wrapper
      const codeRows = h('div', { class: 'code-rows' }, rows);

      // Body
      const bodyClass = this._showLines ? 'code-body collapsed' : 'code-body';
      const bodyProps = { class: bodyClass };
      if (this._showLines) {
        const ch = `${1.2 + this._showLines * 1.5}em`;
        bodyProps.style                    = `max-height: ${ch}`;
        bodyProps['data-collapsed-height'] = ch;
      }
      const codeBody = h('div', bodyProps, [codeRows]);

      // Header — omit only when no lang and no-copy
      const showCopy   = !this._noCopy;
      const showHeader = this._lang || showCopy;

      const copyButton = showCopy
        ? h('button', {
            class:        'copy-button',
            type:         'button',
            'aria-label': 'Copy code',
          }, [raw(COPY_ICON), raw(CHECK_ICON)])
        : null;

      let header = null;
      if (showHeader) {
        const left = [];
        if (this._lang) left.push(h('span', { class: 'code-language' }, [t(this._lang)]));

        const hChildren = [h('div', { class: 'code-header-left' }, left)];
        if (copyButton) hChildren.push(copyButton);
        header = h('div', { class: 'code-header' }, hChildren);
      }

      // Expand/collapse overlay
      let overlay = null;
      if (this._showLines) {
        overlay = h('div', { class: 'code-overlay', 'data-collapsed': 'true' }, [
          h('span', { class: 'overlay-label' }, [t('Expand')]),
          raw(CHEVRON),
        ]);
      }

      // Assemble container
      const containerClass = hasGutter ? 'code-container has-gutter' : 'code-container';
      const containerProps = { class: containerClass };

      const cc = [];
      if (header)  cc.push(header);
      cc.push(codeBody);
      if (overlay) cc.push(overlay);

      hast.children = [h('div', containerProps, cc)];
    },
  };
}
