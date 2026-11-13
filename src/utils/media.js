import fs from 'node:fs';
import path from 'node:path';

// HTML for media in write-ups and on project pages: images, looping clips and YouTube videos, alone, side by side,
// or in a carousel. Shared by the Markdown plugin (src/plugins/remark-media.js) and the project page's main image,
// so both get the same markup; src/utils/media-player.js adds the behavior (clips, carousels, the viewer).
//
// Clips are referenced by their .mp4 and pick up siblings next to it in public/ (see scripts/encode-clip.js):
//   name.jpg       poster, shown until the clip plays

const PUBLIC_DIR = path.resolve('public');

const escape = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const isClip = (src) => /\.mp4$/i.test(src);

/**
 * Privacy-enhanced embed URL for a YouTube watch, share or embed link, or null for anything else.
 */
export function youtubeEmbedUrl(url) {
  if (!/^https?:\/\//.test(url)) return null;
  const { hostname, pathname, searchParams } = new URL(url);
  const host = hostname.replace(/^(www|m)\./, '');
  const id = host === 'youtu.be' ? pathname.slice(1)
    : host === 'youtube.com' ? (searchParams.get('v') ?? pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1])
    : null;
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}

// Site-relative path of a sibling file of a clip, if it exists in public/
function sibling(src, suffix) {
  const candidate = src.replace(/\.mp4$/i, suffix);
  return fs.existsSync(path.join(PUBLIC_DIR, candidate)) ? candidate : null;
}

/**
 * Pixel size of a JPEG or PNG in public/, read from its header, or null if it can't be read.
 */
function imageSize(src) {
  let data;
  try {
    data = fs.readFileSync(path.join(PUBLIC_DIR, src));
  } catch {
    return null;
  }
  // PNG: width and height follow the signature, in the IHDR chunk
  if (data.length >= 24 && data.readUInt32BE(0) === 0x89504e47) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  // JPEG: walk the segments to the frame header (SOF0-SOF15, other than DHT, JPG and DAC)
  if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < data.length && data[offset] === 0xff) {
      const marker = data[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: data.readUInt16BE(offset + 7), height: data.readUInt16BE(offset + 5) };
      }
      offset += 2 + data.readUInt16BE(offset + 2);
    }
  }
  return null;
}

/**
 * Width / height of a media source: an image's own, a clip's poster's, or 16:9 for YouTube and anything unreadable.
 */
function aspectOf(src) {
  const still = youtubeEmbedUrl(src) ? null : posterFor(src);
  const size = still && imageSize(still);
  return size?.width && size?.height ? size.width / size.height : 16 / 9;
}

/**
 * Still image standing in for a media source: the clip's poster, YouTube's thumbnail, or the image itself.
 */
export function posterFor(src) {
  if (!src) return null;
  const youtubeId = youtubeEmbedUrl(src)?.match(/embed\/([^?]+)/)?.[1];
  if (youtubeId) return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  return isClip(src) ? sibling(src, '.jpg') : src;
}

/**
 * Control bar for clips, in place of the browser's (which can't leave out the volume button, and clips have no sound):
 * play / pause, a timeline, the time and fullscreen. Its behavior is in src/utils/media-player.js.
 */
export function playerBarHtml() {
  const icon = (paths) => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${paths}</svg>`;
  return '<div class="player-bar">'
    + `<button type="button" class="player-play" aria-label="Play">${icon('<path class="player-icon-pause" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/><path class="player-icon-play" d="M8 5l11 7-11 7z"/>')}</button>`
    + '<input type="range" class="player-seek" min="0" max="1000" step="1" value="0" aria-label="Seek">'
    + '<span class="player-time"><span class="player-current">0:00</span> / <span class="player-duration">0:00</span></span>'
    + `<button type="button" class="player-fullscreen" aria-label="Fullscreen">${icon('<path class="player-icon-enter" d="M4 9V4h5v2H6v3zm11-5h5v5h-2V6h-3zM4 15h2v3h3v2H4zm14 0h2v5h-5v-2h3z"/><path class="player-icon-exit" d="M7 4h2v5H4V7h3zm8 0h2v3h3v2h-5zM4 15h5v5H7v-3H4zm11 0h5v2h-3v3h-2z"/>')}</button>`
    + '</div>';
}

/**
 * One media frame (`.shot`). `caption` is stored on it for the viewer; `eager` skips lazy loading (main image).
 */
export function shotHtml({ src, alt = '', caption = '', eager = false }) {
  const loading = eager ? '' : ' loading="lazy"';
  const data = `data-caption="${escape(caption)}"`;

  const embed = youtubeEmbedUrl(src);
  if (embed) {
    // Click-to-load: YouTube's player only loads once the visitor asks for it
    return `<button type="button" class="shot shot-youtube" ${data} data-embed="${escape(embed)}&autoplay=1" aria-label="Play video${alt ? `: ${escape(alt)}` : ''}">`
      + `<img class="poster" src="${escape(posterFor(src))}" alt=""${loading} decoding="async">`
      + '<span class="shot-play" aria-hidden="true"></span></button>';
  }

  if (isClip(src)) {
    const poster = sibling(src, '.jpg');
    return `<div class="shot shot-clip player-paused" ${data}>`
      + `<video class="clip" muted loop playsinline disablepictureinpicture preload="${poster ? 'none' : 'metadata'}"${poster ? ` poster="${escape(poster)}"` : ''}${alt ? ` aria-label="${escape(alt)}"` : ''}>`
      + `<source src="${escape(src)}" type="video/mp4"></video>${playerBarHtml()}</div>`;
  }

  return `<div class="shot" ${data}><img src="${escape(src)}" alt="${escape(alt)}"${loading} decoding="async"></div>`;
}

/**
 * A captioned figure with one media frame.
 */
export function figureHtml(item) {
  return `<figure class="media">${shotHtml(item)}${item.caption ? `<figcaption>${escape(item.caption)}</figcaption>` : ''}</figure>`;
}

/**
 * Figures side by side (each keeps its own caption); stacks on narrow screens.
 */
export function rowHtml(items) {
  return `<div class="media-row">${items.map(figureHtml).join('')}</div>`;
}

/**
 * A before / after comparison: two images or two clips of the same size stacked in one frame, the second shown to
 * the right of a split line that the visitor drags (or moves with the arrow keys). Each item's caption labels its
 * side; `caption` is the figure's. Clips play together and stay in sync (src/utils/media-player.js), without the
 * browser's controls, which would sit under the slider.
 */
export function compareHtml(items, caption = '') {
  const [before, after] = items;
  const clips = isClip(before.src) && isClip(after.src);

  const layer = (item, side) => {
    const poster = isClip(item.src) ? sibling(item.src, '.jpg') : null;
    const media = isClip(item.src)
      ? `<video class="compare-clip" muted loop playsinline disablepictureinpicture preload="none"${poster ? ` poster="${escape(poster)}"` : ''} aria-hidden="true">`
        + `<source src="${escape(item.src)}" type="video/mp4"></video>`
      : `<img src="${escape(item.src)}" alt="${escape(item.alt ?? '')}" loading="lazy" decoding="async">`;
    return `<div class="compare-layer compare-${side}">${media}</div>`;
  };
  const label = (item, side) => (item.caption ? `<span class="compare-label compare-label-${side}" aria-hidden="true">${escape(item.caption)}</span>` : '');
  const name = (item, fallback) => item.caption || item.alt || fallback;

  // The clips' descriptions go on the range input, the frame's one control (the videos themselves are hidden from
  // assistive technology, a role="img" frame would hide the input as well)
  const description = clips ? [before.alt, after.alt].filter(Boolean).join(' / ') : '';

  // Clips get the same control bar as other clips
  const controls = clips ? playerBarHtml() : '';

  // The frame is what goes fullscreen; the stage inside it keeps the media's shape, so the split line stays on it
  return '<figure class="media compare">'
    + `<div class="shot shot-compare compare-frame${clips ? ' player-paused' : ''}">`
    + '<div class="compare-stage" style="--split: 50%">'
    + layer(before, 'before') + layer(after, 'after')
    + '<div class="compare-divider" aria-hidden="true"><span class="compare-knob"></span></div>'
    + label(before, 'before') + label(after, 'after')
    + `<input type="range" class="compare-range" min="0" max="100" step="0.1" value="50" aria-label="Split between ${escape(name(before, 'before'))} (left) and ${escape(name(after, 'after'))} (right)"${description ? ` aria-description="${escape(description)}"` : ''}>`
    + controls
    + '</div></div>'
    + (caption ? `<figcaption>${escape(caption)}</figcaption>` : '')
    + '</figure>';
}

/**
 * One figure that shows a single slide at a time, with arrows, dots and a counter. The caption below follows the
 * current slide.
 */
export function carouselHtml(items) {
  const slides = items.map((item, i) =>
    `<div class="carousel-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${items.length}">${shotHtml(item)}</div>`).join('');
  const dots = items.map((_, i) =>
    `<button type="button" class="carousel-dot" aria-label="Show slide ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('');
  const arrow = (direction, label, d) =>
    `<button type="button" class="carousel-arrow carousel-${direction}" aria-label="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg></button>`;

  // The frame takes the shape of the tallest slide, so it fills the page width; wider slides are letterboxed in it
  const aspect = Math.min(...items.map((item) => aspectOf(item.src)));

  return `<figure class="media carousel" aria-roledescription="carousel" style="--carousel-aspect: ${aspect.toFixed(4)}">`
    + `<div class="carousel-frame"><div class="carousel-track" tabindex="0">${slides}</div>`
    + arrow('prev', 'Previous slide', 'M15 18l-6-6 6-6') + arrow('next', 'Next slide', 'M9 18l6-6-6-6') + '</div>'
    + `<div class="carousel-bar"><div class="carousel-dots">${dots}</div><span class="carousel-count" aria-live="polite">1 / ${items.length}</span></div>`
    + `<figcaption${items[0].caption ? '' : ' hidden'}>${escape(items[0].caption ?? '')}</figcaption>`
    + '</figure>';
}
