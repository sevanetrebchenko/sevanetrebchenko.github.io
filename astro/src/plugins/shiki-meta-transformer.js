/**
 * Shiki transformer for code block metadata.
 *
 * Parses meta strings like:
 *   title:{file.cpp} added:{1-3,5} removed:{7} line-numbers:{enable} show-lines:{20} hidden:{10-12}
 *
 * Applies line-level decorations and restructures the HAST tree into a
 * container with header, gutter, and overlay.
 */

import parseRange from 'parse-numeric-range';

/**
 * Parse the meta string into a structured object.
 */
function parseMeta(raw) {
  if (!raw) return {};

  const meta = {};

  // Match key:{value} patterns — value can contain anything except }
  const RE = /(\S+?):\{([^}]*)\}/g;
  let match;
  while ((match = RE.exec(raw)) !== null) {
    const [, key, value] = match;

    switch (key) {
      case 'title':
        meta.title = value;
        break;
      case 'added':
      case 'removed':
      case 'modified':
      case 'highlighted':
      case 'hidden':
        meta[key] = new Set(parseRange(value));
        break;
      case 'line-numbers':
        meta.lineNumbers = value === 'enable' || value === 'enabled';
        break;
      case 'show-lines':
        meta.showLines = parseInt(value, 10);
        break;
    }
  }

  // If any diff lines exist, mark hasDiff
  meta.hasDiff = !!(meta.added?.size || meta.removed?.size || meta.modified?.size);

  return meta;
}

/**
 * Get the text content of a HAST node.
 */
function getTextContent(node) {
  if (node.type === 'text') return node.value;
  if (node.children) return node.children.map(getTextContent).join('');
  return '';
}

/**
 * Create a HAST element node.
 */
function h(tagName, properties, children = []) {
  return {
    type: 'element',
    tagName,
    properties: properties || {},
    children,
  };
}

/**
 * Create a HAST text node.
 */
function text(value) {
  return { type: 'text', value };
}

/**
 * Get the diff symbol for a line.
 */
function getDiffSymbol(lineNum, meta) {
  if (meta.added?.has(lineNum)) return '+';
  if (meta.removed?.has(lineNum)) return '\u2212'; // minus sign
  if (meta.modified?.has(lineNum)) return '~';
  return ' ';
}

/**
 * Get the CSS class for a line's diff status.
 */
function getLineClass(lineNum, meta) {
  if (meta.added?.has(lineNum)) return 'line-added';
  if (meta.removed?.has(lineNum)) return 'line-removed';
  if (meta.modified?.has(lineNum)) return 'line-modified';
  if (meta.highlighted?.has(lineNum)) return 'line-highlighted';
  return '';
}

export function metaTransformer() {
  return {
    name: 'code-meta',

    // preprocess runs before all HAST hooks — parse meta here so it's
    // available in line/span/root hooks
    preprocess(code, options) {
      const raw = options.meta?.__raw;
      const meta = parseMeta(raw);
      this.meta.__codeMeta = meta;
      return code;
    },

    // line hook: apply diff/highlight classes and data-line attributes
    line(lineEl, lineNum) {
      const meta = this.meta?.__codeMeta;
      if (!meta) return;

      // Add data-line attribute (1-based)
      if (!lineEl.properties) lineEl.properties = {};
      lineEl.properties['data-line'] = String(lineNum);

      // Add diff/highlight class
      const cls = getLineClass(lineNum, meta);
      if (cls) {
        this.addClassToHast(lineEl, cls);
      }
    },

    // root hook: restructure HAST into container layout
    // Runs AFTER line and span hooks
    root(rootEl) {
      const meta = this.meta?.__codeMeta;
      const lang = this.options.lang || '';



      // Find the <pre> element in the root
      const preEl = rootEl.children.find(
        (c) => c.type === 'element' && c.tagName === 'pre'
      );
      if (!preEl) return;

      // Find the <code> element in the <pre>
      const codeEl = preEl.children.find(
        (c) => c.type === 'element' && c.tagName === 'code'
      );
      if (!codeEl) return;

      // Collect all line elements (span.line)
      const allLines = codeEl.children.filter(
        (c) => c.type === 'element'
      );

      // Determine which lines are visible (not hidden)
      const visibleLines = [];
      for (let i = 0; i < allLines.length; i++) {
        const lineNum = i + 1; // 1-based
        if (meta?.hidden?.has(lineNum)) continue;
        visibleLines.push({ el: allLines[i], lineNum });
      }

      // Remove trailing empty line if present (Shiki often adds one)
      if (visibleLines.length > 0) {
        const last = visibleLines[visibleLines.length - 1];
        if (getTextContent(last.el).trim() === '') {
          visibleLines.pop();
        }
      }

      // Replace code children with only visible lines
      codeEl.children = visibleLines.map((v) => v.el);

      const showGutter = meta?.lineNumbers || meta?.hasDiff;

      // Build gutter
      let gutterEl = null;
      if (showGutter) {
        const gutterLines = [];
        for (const { lineNum } of visibleLines) {
          const lineNumText = meta.lineNumbers ? String(lineNum) : '';
          const diffSymbol = meta.hasDiff ? getDiffSymbol(lineNum, meta) : '';
          const lineClass = getLineClass(lineNum, meta);

          const parts = [];

          if (meta.lineNumbers) {
            parts.push(
              h('span', { class: ['gutter-number'] }, [text(lineNumText)])
            );
          }

          if (meta.hasDiff) {
            const symbolClass = ['gutter-diff'];
            if (diffSymbol === '+') symbolClass.push('diff-add');
            else if (diffSymbol === '\u2212') symbolClass.push('diff-remove');
            else if (diffSymbol === '~') symbolClass.push('diff-modify');

            parts.push(
              h('span', { class: symbolClass }, [text(diffSymbol)])
            );
          }

          gutterLines.push(
            h('div', {
              class: ['gutter-line', ...(lineClass ? [lineClass] : [])],
            }, parts)
          );
        }

        gutterEl = h('div', { class: ['code-gutter'] }, gutterLines);
      }

      // Build header
      const hasTitle = !!meta?.title;
      const headerChildren = [];

      if (hasTitle) {
        headerChildren.push(
          h('span', { class: ['code-title'] }, [text(meta.title)])
        );
      } else {
        // Spacer to push copy button right
        headerChildren.push(h('span', {}, []));
      }

      // Copy button with SVG icon
      headerChildren.push(
        h(
          'button',
          {
            class: ['copy-button'],
            'data-copy': true,
            'aria-label': 'Copy code',
            type: 'button',
          },
          [
            h('svg', {
              xmlns: 'http://www.w3.org/2000/svg',
              width: '18',
              height: '18',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': '2',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
            }, [
              h('rect', { x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' }),
              h('path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }),
            ]),
          ]
        )
      );

      const headerClasses = ['code-header'];
      if (!hasTitle) headerClasses.push('no-title');

      const headerEl = h('div', { class: headerClasses }, headerChildren);

      // Build code body — wraps gutter + pre
      const codeBodyChildren = [];
      if (gutterEl) codeBodyChildren.push(gutterEl);

      // Strip Shiki's inline styles from pre
      if (preEl.properties?.style) {
        preEl.properties.style = preEl.properties.style
          .replace(/background-color:[^;]+;?/g, '')
          .replace(/color:[^;]+;?/g, '')
          .replace(/--shiki[^;]+;?/g, '')
          .trim();
        if (!preEl.properties.style) delete preEl.properties.style;
      }
      if (preEl.properties?.tabindex) delete preEl.properties.tabindex;

      codeBodyChildren.push(preEl);

      const codeBodyEl = h('div', { class: ['code-body'] }, codeBodyChildren);

      // Build overlay (for show-lines expand/collapse)
      let overlayEl = null;
      if (meta?.showLines && meta.showLines > 0) {
        overlayEl = h(
          'div',
          { class: ['code-overlay'], 'data-collapsed': 'true' },
          [
            h('span', { class: ['overlay-label'] }, [text('Show more')]),
            h('svg', {
              xmlns: 'http://www.w3.org/2000/svg',
              width: '14',
              height: '14',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              'stroke-width': '2',
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              class: ['overlay-icon'],
            }, [
              h('polyline', { points: '6 9 12 15 18 9' }),
            ]),
          ]
        );
      }

      // Build the container
      const containerClasses = ['code-container', `language-${lang}`];
      if (meta?.hasDiff) containerClasses.push('has-diff');
      if (showGutter) containerClasses.push('has-gutter');

      const containerProps = { class: containerClasses };
      if (meta?.showLines && meta.showLines > 0) {
        containerProps['data-show-lines'] = String(meta.showLines);
      }

      const containerChildren = [headerEl, codeBodyEl];
      if (overlayEl) containerChildren.push(overlayEl);

      const containerEl = h('div', containerProps, containerChildren);

      // Replace root children with our container
      rootEl.children = [containerEl];
    },
  };
}
