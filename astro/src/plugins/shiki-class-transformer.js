// Maps github-dark hex colors to semantic CSS class names.
// Add entries here if you see unstyled tokens after a theme change.
const TOKEN_CLASSES = {
  '#c9d1d9': 'tk-fg',
  '#e6edf3': 'tk-fg',
  '#f0f6fc': 'tk-fg',
  '#8b949e': 'tk-comment',
  '#ff7b72': 'tk-keyword',
  '#ffa657': 'tk-type',
  '#79c0ff': 'tk-constant',
  '#a5d6ff': 'tk-string',
  '#d2a8ff': 'tk-function',
  '#7ee787': 'tk-green',
  '#56d364': 'tk-green',
};

export function classTransformer() {
  return {
    name: 'shiki-class-transformer',

    span(node) {
      const style = node.properties?.style;
      if (!style) return;

      const parts = style.split(';').map(s => s.trim()).filter(Boolean);
      const colorPart = parts.find(p => /^color\s*:/i.test(p));
      if (!colorPart) return;

      const hex = (/(#[0-9a-fA-F]{3,8})/i.exec(colorPart) || [])[1]?.toLowerCase();
      if (!hex) return;

      const cls = TOKEN_CLASSES[hex];
      if (!cls) return;

      const existing = node.properties.class;
      node.properties.class = existing ? `${existing} ${cls}` : cls;

      const remaining = parts.filter(p => !/^color\s*:/i.test(p)).join('; ');
      if (remaining) {
        node.properties.style = remaining;
      } else {
        delete node.properties.style;
      }
    },
  };
}
