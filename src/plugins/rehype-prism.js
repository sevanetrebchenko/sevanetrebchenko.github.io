import { visit } from 'unist-util-visit';
import rangeParser from 'parse-numeric-range';
import Prism from 'prismjs';

// Load language definitions
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-glsl.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-python.js';

// ---------------------------------------------------------------------------
// HAST helpers
// ---------------------------------------------------------------------------
function h(tag, props, children) {
  return { type: 'element', tagName: tag, properties: props || {}, children: children || [] };
}
function t(value) {
  return { type: 'text', value: String(value) };
}
function raw(html) {
  return { type: 'raw', value: html };
}

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------
const COPY_ICON  = '<svg class="btn-icon copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>';
const CHECK_ICON = '<svg class="btn-icon check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const CHEVRON    = '<svg class="overlay-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';

// ---------------------------------------------------------------------------
// Prism token flattener — ported from old site
// ---------------------------------------------------------------------------
function tokenize(token, types = []) {
  let tokenized = [];

  if (typeof token === 'string') {
    let temp = [];
    for (const word of token.split(/(?=[\n\s])|(?<=[\n\s])/g)) {
      temp.push(word);
    }

    for (let i = 0; i < temp.length; ++i) {
      if (temp[i] === '\n') {
        tokenized.push({ content: temp[i], types: ['plain'] });
      } else if (temp[i].length > 1) {
        tokenized.push({
          content: temp[i],
          types: types.length > 0 ? types : ['plain'],
        });
      } else {
        let result = temp[i];
        for (let j = i + 1; j < temp.length; j++, i++) {
          if (temp[i] !== temp[j]) break;
          result += temp[j];
        }
        tokenized.push({ content: result, types: ['plain'] });
      }
    }
  } else {
    let types_ = [...types];
    if (!types_.includes(token.type)) {
      types_.push(token.type);
    }

    if (token.content instanceof Array) {
      for (const element of token.content) {
        tokenized = tokenized.concat(tokenize(element, types_));
      }
    } else if (typeof token.content === 'object') {
      tokenized = tokenized.concat(tokenize(token.content, types_));
    } else {
      tokenized.push({ content: token.content, types: types_ });
    }
  }

  return tokenized;
}

// ---------------------------------------------------------------------------
// C++ language processor — ported from old site
// ---------------------------------------------------------------------------
const VALID_ANNOTATION_TYPES = new Set([
  'class-name', 'namespace-name', 'member-variable',
  'preprocessor-directive', 'macro', 'macro-name', 'macro-argument',
  'enum-name', 'enum-value', 'function', 'plain', 'punctuation',
  'number', 'string', 'keyword', 'concept',
  'operator', 'unary-operator', 'binary-operator', 'function-operator',
]);

function processLanguageCpp(tokens) {
  const parsed = [];
  let i = 0;

  // Remove 'operator' type from all tokens
  for (let j = 0; j < tokens.length; ++j) {
    tokens[j].types = tokens[j].types.filter(type => type !== 'operator');
  }

  while (i < tokens.length) {
    if (tokens[i].content === '[' && tokens[i + 1]?.content === '[') {
      let annotation = '';
      let j = i;

      while (true) {
        if (!tokens[j] || !tokens[j].content) break;
        annotation += tokens[j].content;
        if (tokens[j].content === ']' && tokens[j + 1]?.content !== ']') break;
        ++j;
      }

      annotation = annotation.slice(2, annotation.length - 2);
      const components = annotation.split(',');
      const types = components[0].split('.');

      if (!types.every(type => VALID_ANNOTATION_TYPES.has(type))) {
        while (i !== j) {
          parsed.push(tokens[i]);
          ++i;
        }
        continue;
      }

      const value = components[1];
      parsed.push({ content: value, types: types });
      i = j;
    } else {
      parsed.push(tokens[i]);
    }
    ++i;
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Token type to CSS class mapping
// Maps Prism types and custom annotation types to tk-* CSS classes.
// Custom annotation types (from processLanguageCpp) pass through as tk-{type}.
// Prism built-in types are mapped to semantic tk-* classes.
// ---------------------------------------------------------------------------
const PRISM_TYPE_MAP = {
  'comment':    'tk-comment',
  'keyword':    'tk-keyword',
  'boolean':    'tk-keyword',
  'string':     'tk-string',
  'char':       'tk-string',
  'regex':      'tk-string',
  'attr-value': 'tk-string',
  'number':     'tk-number',
  'constant':   'tk-constant',
  'symbol':     'tk-constant',
  'function':   'tk-function',
  'class-name': 'tk-class-name',
  'builtin':    'tk-type',
  'attr-name':  'tk-green',
  'selector':   'tk-green',
  'tag':        'tk-keyword',
  'property':   'tk-fg',
  'punctuation':'tk-punctuation',
  'operator':   'tk-fg',
  // Custom annotation types — map directly
  'namespace-name':    'tk-namespace-name',
  'member-variable':   'tk-member-variable',
  'enum-name':         'tk-enum-name',
  'enum-value':        'tk-enum-value',
  'concept':           'tk-concept',
  'unary-operator':    'tk-operator',
  'binary-operator':   'tk-operator',
  'function-operator': 'tk-operator',
  'macro':             'tk-macro',
  'macro-name':        'tk-macro-name',
  'macro-argument':    'tk-macro-argument',
  'preprocessor-directive': 'tk-preprocessor-directive',
  'directive-hash':        'tk-preprocessor-directive',
  'directive':             'tk-preprocessor-directive',
  'double-colon':          'tk-double-colon',
  'plain':             'tk-plain',
};

function typesToClass(types) {
  // Iterate in reverse — the last (most specific/innermost) type takes priority.
  // e.g. for ['macro', 'comment'], 'comment' should win over 'macro'.
  for (let i = types.length - 1; i >= 0; i--) {
    const cls = PRISM_TYPE_MAP[types[i]];
    if (cls) return cls;
  }
  // Every token gets at least tk-plain
  return 'tk-plain';
}

// ---------------------------------------------------------------------------
// Language aliases
// ---------------------------------------------------------------------------
const LANG_ALIASES = {
  'js': 'javascript',
  'ts': 'typescript',
  'sh': 'bash',
  'shell': 'bash',
  'py': 'python',
  'yml': 'yaml',
  'c++': 'cpp',
  'h': 'cpp',
  'hpp': 'cpp',
};

// ---------------------------------------------------------------------------
// Extract raw text from HAST
// ---------------------------------------------------------------------------
function extractText(node) {
  if (node.type === 'text') return node.value;
  if (node.children) return node.children.map(extractText).join('');
  return '';
}

// ---------------------------------------------------------------------------
// Rehype plugin
// ---------------------------------------------------------------------------
export default function rehypePrism() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre') return;

      const codeEl = node.children?.find(n => n.type === 'element' && n.tagName === 'code');
      if (!codeEl) return;

      // Extract language from class
      const classStr = codeEl.properties?.className;
      const classes = Array.isArray(classStr) ? classStr : (classStr || '').split(/\s+/);
      const langClass = classes.find(c => c.startsWith('language-'));
      let lang = langClass ? langClass.replace('language-', '') : null;
      if (lang) lang = LANG_ALIASES[lang] || lang;

      // Extract meta string
      const meta = codeEl.properties?.metastring || codeEl.data?.meta || '';

      // Extract source code
      const source = extractText(codeEl);

      // Parse metadata
      const get = (pattern) => (pattern.exec(meta) || [])[1] ?? null;
      const added     = rangeParser(get(/\badded\b:\{([^}]+)\}/)   ?? '');
      const removed   = rangeParser(get(/\bremoved\b:\{([^}]+)\}/) ?? '');
      const lineNums  = /\bline-numbers\b:\{enabled?\}/i.test(meta);
      const showLines = Number(get(/\bshow-lines\b:\{(\d+)\}/))    || null;
      const hidden    = rangeParser(get(/\bhidden\b:\{([^}]+)\}/)  ?? '');
      const noCopy    = /\bno-copy\b/.test(meta);

      // Tokenize with Prism
      let tokens;
      const grammar = lang ? Prism.languages[lang] : null;
      if (grammar) {
        const rawTokens = Prism.tokenize(source, grammar);
        tokens = [];
        for (const tok of rawTokens) {
          tokens = tokens.concat(tokenize(tok));
        }
      } else {
        tokens = source.split('\n').flatMap((line, i, arr) => {
          const result = [{ content: line, types: ['plain'] }];
          if (i < arr.length - 1) result.push({ content: '\n', types: ['plain'] });
          return result;
        });
      }

      // Language-specific processing
      if (lang === 'cpp' || lang === 'c') {
        tokens = processLanguageCpp(tokens);
      }

      // Split tokens into lines
      const lines = [[]];
      for (const tok of tokens) {
        if (tok.content === '\n') {
          lines.push([]);
        } else if (tok.content.includes('\n')) {
          const parts = tok.content.split('\n');
          for (let i = 0; i < parts.length; i++) {
            if (i > 0) lines.push([]);
            if (parts[i]) lines[lines.length - 1].push({ content: parts[i], types: tok.types });
          }
        } else {
          lines[lines.length - 1].push(tok);
        }
      }

      // Remove trailing empty line
      if (lines.length > 0 && lines[lines.length - 1].length === 0) {
        lines.pop();
      }

      // Filter hidden lines
      const visible = lines
        .map((toks, i) => ({ toks, orig: i + 1 }))
        .filter(({ orig }) => !hidden.includes(orig));

      const hasDiff   = added.length > 0 || removed.length > 0;
      const hasGutter = lineNums || hasDiff;

      // Build rows
      const rows = visible.map(({ toks: lineTokens, orig }, idx) => {
        const isAdded   = added.includes(orig);
        const isRemoved = removed.includes(orig);

        const rowClass = isAdded   ? 'code-row line-added'
                       : isRemoved ? 'code-row line-removed'
                       : 'code-row';

        const children = [];

        if (hasGutter) {
          const gc = [];
          if (lineNums) {
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

        const lineChildren = lineTokens.map(tok => {
          const cls = typesToClass(tok.types);
          return cls ? h('span', { class: cls }, [t(tok.content)]) : t(tok.content);
        });

        children.push(h('div', { class: 'line-content' }, lineChildren));
        return h('div', { class: rowClass }, children);
      });

      // Assemble structure
      const codeRows   = h('div', { class: 'code-rows' }, rows);
      const codeScroll = h('div', { class: 'code-scroll' }, [codeRows]);

      const bodyClass = showLines ? 'code-body collapsed' : 'code-body';
      const bodyProps = { class: bodyClass };
      if (showLines) {
        const ch = `${1.2 + showLines * 1.5}em`;
        bodyProps.style                    = `max-height: ${ch}`;
        bodyProps['data-collapsed-height'] = ch;
      }
      const codeBody = h('div', bodyProps, [codeScroll]);

      const showCopy   = !noCopy;
      const showHeader = lang || showCopy;

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
        if (lang) left.push(h('span', { class: 'code-language' }, [t(lang)]));
        const hChildren = [h('div', { class: 'code-header-left' }, left)];
        if (copyButton) hChildren.push(copyButton);
        header = h('div', { class: 'code-header' }, hChildren);
      }

      let overlay = null;
      if (showLines) {
        const hiddenCount = visible.length - showLines;
        const showMoreText = hiddenCount > 0
          ? `Show ${hiddenCount} more line${hiddenCount === 1 ? '' : 's'}`
          : 'Expand';
        overlay = h('div', {
          class: 'code-overlay',
          'data-collapsed': 'true',
          'data-show-more': showMoreText,
          'data-show-less': 'Show less',
        }, [
          h('span', { class: 'overlay-label' }, [t(showMoreText)]),
          raw(CHEVRON),
        ]);
      }

      const containerClass = hasGutter ? 'code-container has-gutter' : 'code-container';
      const cc = [];
      if (header)  cc.push(header);
      cc.push(codeBody);
      if (overlay) cc.push(overlay);

      parent.children[index] = h('div', { class: containerClass }, cc);
    });
  };
}
