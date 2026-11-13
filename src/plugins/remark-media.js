import { visit, SKIP } from 'unist-util-visit';
import { figureHtml, rowHtml, carouselHtml, compareHtml } from '../utils/media.js';

// Turns Markdown images into the site's media figures (see src/utils/media.js):
//
//   ![alt](/projects/x/render.jpg "caption")           one figure; .mp4 sources become looping clips and
//                                                       YouTube links a click-to-play video
//
//   ![alt](/a.jpg "caption")                           images on consecutive lines of one paragraph sit side by
//   ![alt](/b.mp4 "caption")                           side, each with its own caption
//
//   ::carousel                                         one frame showing a slide at a time
//   ![alt](/a.jpg "caption")
//   ![alt](/b.jpg "caption")
//   ::
//
//   ::comparison[caption]                              two images or two clips in one frame, with a slider between
//   ![alt](/before.mp4 "label")                        them; each title labels its side, the [caption] is optional
//   ![alt](/after.mp4 "label")
//   ::
//
// Needs remark-directive before it. To remark-directive, ::name is a one-line (leaf) directive, so the images after it
// and the closing :: are ordinary siblings; this plugin gathers them up to the closing line.
// Other directives are turned back into the text they came from, so a stray colon in prose (e.g. "ratio:x") renders as written.

// Images in a node, if it holds nothing but images and whitespace
function onlyImages(node) {
  const images = [];
  for (const child of node.children ?? []) {
    if (child.type === 'image') images.push(child);
    else if (child.type === 'break' || (child.type === 'text' && !child.value.trim())) continue;
    else return null;
  }
  return images.length ? images : null;
}

const toItem = (image) => ({ src: image.url, alt: image.alt ?? '', caption: image.title ?? '' });

// Markdown source of a directive that isn't ours, for putting it back as text
function directiveSource(node) {
  const marker = node.type === 'textDirective' ? ':' : node.type === 'leafDirective' ? '::' : ':::';
  const label = node.children?.length ? `[${node.children.map((child) => child.value ?? '').join('')}]` : '';
  return `${marker}${node.name}${label}`;
}

// Images from the siblings after a ::carousel / ::comparison line, up to its closing "::".
// The closing line is its own paragraph after a blank line, or, right under the images, the end of their paragraph.
// Returns the images and the index of the last sibling used.
function blockImages(parent, start, name) {
  const images = [];
  for (let i = start + 1; i < parent.children.length; i++) {
    const node = parent.children[i];
    if (node.type !== 'paragraph') break;
    const last = node.children.at(-1);
    const closes = last?.type === 'text' && last.value.trimEnd().endsWith('::');
    const children = closes
      ? [...node.children.slice(0, -1), { ...last, value: last.value.trimEnd().slice(0, -2) }]
      : node.children;
    const found = onlyImages({ children });
    if (found) images.push(...found);
    else if (!closes || children.some((child) => child.type !== 'text' || child.value.trim())) break;
    if (closes) return { images, end: i };
  }
  throw new Error(`::${name} has no closing :: line after its images`);
}

export default function remarkMedia() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index === undefined) return;

      if (node.type === 'leafDirective' && node.name === 'carousel') {
        const { images, end } = blockImages(parent, index, node.name);
        parent.children.splice(index, end - index + 1, { type: 'html', value: carouselHtml(images.map(toItem)) });
        return index + 1;
      }

      if (node.type === 'leafDirective' && node.name === 'comparison') {
        // remark-directive puts the [label] in the leaf directive's own children
        const caption = node.children.map((child) => child.value ?? '').join('');
        const { images, end } = blockImages(parent, index, node.name);
        if (images.length !== 2) throw new Error(`::comparison needs exactly two images or clips, found ${images.length}`);
        parent.children.splice(index, end - index + 1, { type: 'html', value: compareHtml(images.map(toItem), caption) });
        return index + 1;
      }

      if (node.type === 'containerDirective') {
        parent.children.splice(index, 1, { type: 'paragraph', children: [{ type: 'text', value: directiveSource(node) }] }, ...node.children);
        return index + 1;
      }

      if (node.type === 'textDirective' || node.type === 'leafDirective') {
        const text = { type: 'text', value: directiveSource(node) };
        parent.children[index] = node.type === 'leafDirective' ? { type: 'paragraph', children: [text] } : text;
        return SKIP;
      }

      if (node.type === 'paragraph') {
        const images = onlyImages(node);
        if (!images) return;
        const items = images.map(toItem);
        parent.children[index] = { type: 'html', value: items.length === 1 ? figureHtml(items[0]) : rowHtml(items) };
        return SKIP;
      }
    });
  };
}
