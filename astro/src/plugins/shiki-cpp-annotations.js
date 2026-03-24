/**
 * Shiki transformer for C++ annotation syntax: [[type,value]]
 *
 * Preprocesses code to strip annotations before Shiki tokenizes,
 * then re-applies semantic CSS classes to the generated spans via the span hook.
 */

const KNOWN_TYPES = new Set([
  'class-name',
  'namespace-name',
  'member-variable',
  'enum-name',
  'enum-value',
  'function',
  'function-operator',
  'operator',
  'unary-operator',
  'binary-operator',
  'concept',
  'keyword',
  'macro',
  'macro-name',
  'macro-argument',
  'preprocessor-directive',
  'punctuation',
  'string',
  'number',
  'plain',
]);

// Matches [[type,value]] — value can contain ] as long as it's not ]]
const ANNOTATION_RE = /\[\[([a-z][a-z0-9._-]*),((?:[^\]]|\](?!\]))*)\]\]/g;

/**
 * Process a single line: strip annotations and record per-line column ranges.
 * Returns { cleaned, annotations } where annotations is an array of
 * { col, end, type } — column positions (0-based) in the cleaned line.
 */
function processLine(line) {
  const annotations = [];
  let cleaned = '';
  let lastIndex = 0;

  ANNOTATION_RE.lastIndex = 0;

  let match;
  while ((match = ANNOTATION_RE.exec(line)) !== null) {
    const [fullMatch, type, value] = match;
    const matchStart = match.index;

    if (!KNOWN_TYPES.has(type)) {
      // Not one of our annotations (e.g. [[nodiscard]]) — leave as-is
      continue;
    }

    // Append everything before this annotation
    cleaned += line.slice(lastIndex, matchStart);

    if (value.length > 0) {
      const col = cleaned.length;
      cleaned += value;
      annotations.push({ col, end: cleaned.length, type });
    }
    // If value is empty (e.g. [[member-variable,]]), just strip it

    lastIndex = matchStart + fullMatch.length;
  }

  // Append remainder
  cleaned += line.slice(lastIndex);

  return { cleaned, annotations };
}

/**
 * Get the text content of a HAST node.
 */
function getTextContent(node) {
  if (node.type === 'text') return node.value;
  if (node.children) return node.children.map(getTextContent).join('');
  return '';
}

export function cppAnnotationsTransformer() {
  return {
    name: 'cpp-annotations',

    preprocess(code, options) {
      const lang = options.lang;
      if (lang !== 'cpp' && lang !== 'c++' && lang !== 'c') {
        return code;
      }

      // Process each line independently
      const lines = code.split('\n');
      const allAnnotations = {}; // keyed by 1-based line number
      const cleanedLines = [];

      for (let i = 0; i < lines.length; i++) {
        const { cleaned, annotations } = processLine(lines[i]);
        cleanedLines.push(cleaned);
        if (annotations.length > 0) {
          allAnnotations[i + 1] = annotations; // 1-based line number
        }
      }

      // Store per-line annotations for the span hook
      if (!options.meta) options.meta = {};
      options.meta.__cppAnnotations = allAnnotations;

      return cleanedLines.join('\n');
    },

    span(spanEl, line, col, lineElement, token) {
      const allAnnotations = this.options.meta?.__cppAnnotations;
      if (!allAnnotations) return;

      const lineAnnotations = allAnnotations[line];
      if (!lineAnnotations) return;

      const text = token.content;
      const spanStart = col;
      const spanEnd = col + text.length;

      for (const ann of lineAnnotations) {
        if (ann.col < spanEnd && ann.end > spanStart) {
          // Overlap — apply annotation class
          this.addClassToHast(spanEl, ann.type);

          // Remove inline color style so CSS class takes effect
          if (spanEl.properties?.style) {
            spanEl.properties.style = spanEl.properties.style
              .replace(/color:[^;]+;?/g, '')
              .trim();
            if (!spanEl.properties.style) {
              delete spanEl.properties.style;
            }
          }
        }
      }
    },
  };
}
