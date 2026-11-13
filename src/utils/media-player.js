// Behavior for the media markup from src/utils/media.js: clips that play while visible, carousels, click-to-load
// YouTube videos, and a viewer that shows a clicked image large.

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const saveData = Boolean(navigator.connection?.saveData);

// ---------------------------------------------------------------------------
// Control bars (playerBarHtml in src/utils/media.js), shared by clips and comparisons: play / pause, a timeline that
// follows playback and can be dragged, the time, and fullscreen for the bar's frame. `player` says how to play, pause,
// load and seek, and which video's time to show.
// ---------------------------------------------------------------------------

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function setupPlayerBar(root, player) {
  const bar = root.querySelector('.player-bar');
  const play = bar.querySelector('.player-play');
  const seek = bar.querySelector('.player-seek');
  const current = bar.querySelector('.player-current');
  const duration = bar.querySelector('.player-duration');
  const fullscreen = bar.querySelector('.player-fullscreen');
  const video = player.video;
  let dragging = false;

  function showTime(time) {
    const total = video.duration || 0;
    current.textContent = formatTime(time);
    duration.textContent = formatTime(total);
    if (!dragging && total) {
      const fraction = time / total;
      seek.value = String(Math.round(fraction * 1000));
      seek.style.setProperty('--progress', `${fraction * 100}%`);
    }
  }

  // The timeline moves every frame while playing (timeupdate only fires a few times a second)
  let frame = 0;
  const tick = () => {
    showTime(video.currentTime);
    frame = requestAnimationFrame(tick);
  };
  video.addEventListener('play', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(tick); });
  video.addEventListener('pause', () => { cancelAnimationFrame(frame); showTime(video.currentTime); });
  video.addEventListener('loadedmetadata', () => showTime(video.currentTime));
  video.addEventListener('seeked', () => showTime(video.currentTime));

  play.addEventListener('click', () => player.toggle());

  seek.addEventListener('pointerdown', () => player.load());
  seek.addEventListener('input', () => {
    dragging = true;
    seek.style.setProperty('--progress', `${Number(seek.value) / 10}%`);
    if (!video.duration) return;
    const time = (Number(seek.value) / 1000) * video.duration;
    current.textContent = formatTime(time);
    player.seek(time);
  });
  seek.addEventListener('change', () => { dragging = false; });

  if (root.requestFullscreen) {
    fullscreen.addEventListener('click', () => {
      if (document.fullscreenElement === root) document.exitFullscreen();
      else root.requestFullscreen().catch(() => {});
    });
  } else {
    fullscreen.hidden = true;
  }

  // Called by the owner whenever it starts or stops playing
  return (paused) => {
    root.classList.toggle('player-paused', paused);
    play.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  };
}

// Fullscreen state for bars, and phones turning fullscreen clips sideways where the browser allows it
document.addEventListener('fullscreenchange', () => {
  document.querySelectorAll('.player-fullscreen-on').forEach((root) => root.classList.remove('player-fullscreen-on'));
  document.querySelectorAll('.player-fullscreen').forEach((button) => button.setAttribute('aria-label', 'Fullscreen'));
  const root = document.fullscreenElement;
  if (root?.querySelector('.player-bar')) {
    root.classList.add('player-fullscreen-on');
    root.querySelector('.player-fullscreen')?.setAttribute('aria-label', 'Exit fullscreen');
    if (matchMedia('(pointer: coarse)').matches) screen.orientation?.lock?.('landscape')?.catch(() => {});
  } else if (matchMedia('(pointer: coarse)').matches) {
    screen.orientation?.unlock?.();
  }
});

// ---------------------------------------------------------------------------
// Clips: play muted and looping while at least 30% visible (or fullscreen) and paused otherwise. A clip the visitor
// paused stays paused. With reduced motion or data saver on, clips wait on their poster for a click.
// ---------------------------------------------------------------------------

const clips = Array.from(document.querySelectorAll('video.clip'));
const visible = new Set();
const pausedByPage = new WeakSet();
const pausedByVisitor = new WeakSet();
let viewerOpen = false;

function updateClip(video) {
  const shown = visible.has(video) || Boolean(document.fullscreenElement?.contains(video));
  const play = shown && !document.hidden && !viewerOpen && !reducedMotion.matches && !saveData;
  if (play && !pausedByVisitor.has(video)) {
    video.play().catch(() => {});
  } else if (!play && !video.paused) {
    pausedByPage.add(video);
    video.pause();
  }
}

// Comparisons (below) follow the same conditions, so they update along with the clips
const compareUpdates = [];
const updateClips = () => {
  clips.forEach(updateClip);
  compareUpdates.forEach((update) => update());
};

clips.forEach((video) => {
  const root = video.closest('.shot-clip');
  const togglePlay = () => (video.paused ? video.play().catch(() => {}) : video.pause());
  const setPaused = root?.querySelector('.player-bar') ? setupPlayerBar(root, {
    video,
    toggle: togglePlay,
    load: () => { video.preload = 'auto'; },
    seek: (time) => { video.currentTime = time; },
  }) : () => {};

  video.addEventListener('pause', () => {
    if (!pausedByPage.delete(video)) pausedByVisitor.add(video);
    setPaused(true);
  });
  video.addEventListener('play', () => {
    pausedByVisitor.delete(video);
    setPaused(false);
  });
  // Clicking the picture plays or pauses, like the browser's player
  video.addEventListener('click', togglePlay);
});

document.addEventListener('fullscreenchange', updateClips);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
    updateClip(entry.target);
  }), { threshold: 0.3 });
  clips.forEach((video) => observer.observe(video));
}

document.addEventListener('visibilitychange', updateClips);
reducedMotion.addEventListener('change', updateClips);

// ---------------------------------------------------------------------------
// YouTube: swap the poster for the player on click
// ---------------------------------------------------------------------------

document.querySelectorAll('.shot-youtube').forEach((button) => {
  button.addEventListener('click', () => {
    const frame = document.createElement('div');
    frame.className = 'shot shot-youtube-on';
    const iframe = document.createElement('iframe');
    iframe.src = button.dataset.embed;
    iframe.title = button.getAttribute('aria-label') ?? 'YouTube video';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
    button.replaceWith(frame);
  });
});

// ---------------------------------------------------------------------------
// Carousels: a scroll-snapped track (so touch swiping is native), with arrows, dots, a counter, and the caption
// of the current slide
// ---------------------------------------------------------------------------

document.querySelectorAll('.carousel').forEach((carousel) => {
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const dots = Array.from(carousel.querySelectorAll('.carousel-dot'));
  const count = carousel.querySelector('.carousel-count');
  const caption = carousel.querySelector('figcaption');

  if (slides.length < 2) {
    carousel.classList.add('carousel-single');
    return;
  }

  // `current` follows the scroll position; `target` is where the arrows are heading, so quick clicks add up
  let current = 0;
  let target = 0;
  const indexFromScroll = () => Math.round(track.scrollLeft / track.clientWidth);

  // The arrows, the dots and counter, and the caption follow the current slide's image, not the whole frame: image
  // slides are letterboxed to their own shape (an image narrower than 16:9 sits centered with space on either side).
  // --fit-width is the image's width, --fit-inset the empty space on each side of it.
  function fitCaption() {
    const shot = slides[current].querySelector('.shot');
    const image = shot?.matches('.shot-clip, .shot-youtube') ? null : shot?.querySelector('img');
    const width = image?.complete && image.naturalWidth ? image.offsetWidth : shot?.offsetWidth;
    if (!width) {
      carousel.style.removeProperty('--fit-width');
      carousel.style.removeProperty('--fit-inset');
      return;
    }
    carousel.style.setProperty('--fit-width', `${width}px`);
    carousel.style.setProperty('--fit-inset', `${Math.max(0, (track.clientWidth - width) / 2)}px`);
  }

  function show(index) {
    current = index;
    dots.forEach((dot, i) => dot.toggleAttribute('aria-current', i === index));
    count.textContent = `${index + 1} / ${slides.length}`;
    const text = slides[index].querySelector('.shot')?.dataset.caption ?? '';
    caption.textContent = text;
    caption.hidden = !text;
    fitCaption();
  }

  // Images load lazily and the frame changes size with the window, so the caption is refitted after both
  slides.forEach((slide, i) => slide.querySelector('img')?.addEventListener('load', () => { if (i === current) fitCaption(); }));
  new ResizeObserver(fitCaption).observe(track);

  // Wrapping around keeps sliding the same way: past the last slide, the first is moved (flex order) to sit after it
  // and the track slides onto it; back from the first, the last is moved in front of it. Once the slide settles, the
  // order is restored and the track put back on the same slide in its real position.
  let wrapping = false;
  function go(index) {
    if (wrapping) return;
    const forward = index >= slides.length;
    const backward = index < 0;
    target = (index + slides.length) % slides.length;
    if ((forward || backward) && !reducedMotion.matches) {
      wrapping = true;
      const width = track.clientWidth;
      if (forward) {
        slides[0].style.order = '1';
        track.scrollTo({ left: (slides.length - 2) * width, behavior: 'auto' });
        track.scrollTo({ left: (slides.length - 1) * width, behavior: 'smooth' });
      } else {
        slides[slides.length - 1].style.order = '-1';
        track.scrollTo({ left: width, behavior: 'auto' });
        track.scrollTo({ left: 0, behavior: 'smooth' });
      }
      show(target);
      return;
    }
    track.scrollTo({ left: target * track.clientWidth, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  function finishWrap() {
    slides.forEach((slide) => { slide.style.order = ''; });
    track.scrollTo({ left: target * track.clientWidth, behavior: 'auto' });
    wrapping = false;
  }

  let frame = 0;
  let settle = 0;
  track.addEventListener('scroll', () => {
    // While wrapping, the slides are out of order, so the scroll position doesn't say which one is showing
    clearTimeout(settle);
    if (wrapping) {
      settle = setTimeout(finishWrap, 150);
      return;
    }
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const index = indexFromScroll();
      if (index !== current) show(index);
    });
    // Once scrolling stops (including after a swipe), the arrows continue from where the track ended up
    settle = setTimeout(() => { target = indexFromScroll(); }, 150);
  }, { passive: true });

  carousel.querySelector('.carousel-prev').addEventListener('click', () => go(target - 1));
  carousel.querySelector('.carousel-next').addEventListener('click', () => go(target + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(target - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); go(target + 1); }
  });

  // Keep the current slide in place when the width changes
  addEventListener('resize', () => track.scrollTo({ left: current * track.clientWidth, behavior: 'auto' }));
});

// ---------------------------------------------------------------------------
// Comparisons: a range input across the frame moves the split line. Clips play together while visible, like other
// clips (a visitor's pause sticks; with reduced motion or data saver they wait for the play button), and the second
// is kept on the first's timeline.
// ---------------------------------------------------------------------------

document.querySelectorAll('.compare').forEach((figure) => {
  const frame = figure.querySelector('.compare-frame');
  const stage = frame.querySelector('.compare-stage');
  const range = stage.querySelector('.compare-range');
  range.addEventListener('input', () => stage.style.setProperty('--split', `${range.value}%`));

  const videos = Array.from(stage.querySelectorAll('video.compare-clip'));
  if (videos.length !== 2 || !stage.querySelector('.player-bar')) return;
  const [lead, follower] = videos;

  let isVisible = false;
  let pausedByVisitor = reducedMotion.matches || saveData;
  let playing = false;
  let seeking = false;
  let seekDone = 0;

  // How far the follower is ahead of `target` seconds, the short way around the loop
  function drift(target) {
    const duration = lead.duration || follower.duration;
    let difference = follower.currentTime - target;
    if (duration) difference -= Math.round(difference / duration) * duration;
    return difference;
  }

  // Keeps the follower on the lead's timeline, checked on every frame the lead shows: small differences are closed
  // by playing the follower slightly faster or slower (seeking would restart decoding from a keyframe and fall behind
  // again), large ones by seeking
  function sync(mediaTime) {
    const difference = drift(mediaTime);
    if (Math.abs(difference) > 0.25) {
      follower.currentTime = mediaTime;
      follower.playbackRate = 1;
    } else if (Math.abs(difference) > 1 / 120) {
      follower.playbackRate = 1 - Math.max(-0.2, Math.min(0.2, difference * 4));
    } else {
      follower.playbackRate = 1;
    }
  }

  function onLeadFrame(_, metadata) {
    if (playing && !seeking) sync(metadata.mediaTime);
    if (playing) lead.requestVideoFrameCallback(onLeadFrame);
  }

  let fallbackTimer = 0;
  function startSync() {
    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) lead.requestVideoFrameCallback(onLeadFrame);
    else fallbackTimer = setInterval(() => { if (!seeking) sync(lead.currentTime); }, 100);
  }

  // Both have a frame decoded before they start, so they start together
  const ready = (video) => (video.readyState >= 2 ? Promise.resolve()
    : new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true })));
  const load = () => videos.forEach((video) => { video.preload = 'auto'; });

  let update = () => {};
  const setPaused = setupPlayerBar(frame, {
    video: lead,
    toggle: () => { pausedByVisitor = !pausedByVisitor; update(); },
    load,
    seek: (time) => {
      seeking = true;
      videos.forEach((video) => { video.currentTime = time; });
      clearTimeout(seekDone);
      seekDone = setTimeout(() => { seeking = false; }, 200);
    },
  });

  update = async () => {
    const shouldPlay = (isVisible || document.fullscreenElement === frame) && !document.hidden && !viewerOpen && !pausedByVisitor;
    setPaused(!shouldPlay);
    if (shouldPlay === playing) return;
    playing = shouldPlay;

    if (shouldPlay) {
      load();
      await Promise.all(videos.map(ready));
      if (!playing) return;
      follower.currentTime = lead.currentTime;
      await Promise.all(videos.map((video) => video.play().catch(() => {})));
      startSync();
    } else {
      videos.forEach((video) => video.pause());
      follower.playbackRate = 1;
      clearInterval(fallbackTimer);
    }
  };

  compareUpdates.push(() => update());
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      update();
    }, { threshold: 0.3 }).observe(frame);
  }
  update();
});

// ---------------------------------------------------------------------------
// Viewer: click any image to see it large, one image at a time
// ---------------------------------------------------------------------------

const items = Array.from(document.querySelectorAll('main .shot:not(.shot-youtube):not(.shot-clip):not(.shot-compare), main .prose figure img:not(.shot img)'));

if (items.length && typeof HTMLDialogElement === 'function') {
  const dialog = document.createElement('dialog');
  dialog.className = 'viewer';
  dialog.setAttribute('aria-label', 'Image viewer');
  // The stage holds the frame, with the close button above its corner and the caption below it
  dialog.innerHTML = '<div class="viewer-stage"><div class="viewer-frame"></div>'
    + '<button type="button" class="viewer-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>'
    + '<p class="viewer-caption"></p></div>';
  document.body.appendChild(dialog);

  const frame = dialog.querySelector('.viewer-frame');
  const caption = dialog.querySelector('.viewer-caption');

  // Figure numbers as the page shows them: every visible caption in order ("Fig. N" comes from a CSS counter on
  // the page, and the main image's caption is Fig. 1 when it has one)
  const figcaptions = Array.from(document.querySelectorAll('main figcaption')).filter((caption) => !caption.hidden);

  function figureNumber(item) {
    const index = figcaptions.indexOf(item.closest('figure')?.querySelector(':scope > figcaption'));
    return index >= 0 ? index + 1 : null;
  }

  function captionFor(item) {
    if (item.dataset.caption) return item.dataset.caption;
    const figcaption = item.closest('figure')?.querySelector(':scope > figcaption');
    const text = figcaption?.cloneNode(true);
    text?.querySelector('span.font-mono')?.remove(); // The main image's caption carries its own "Fig. 1" label
    return text?.textContent.trim() || item.querySelector('img')?.alt || item.alt || '';
  }

  // The frame takes the image's own aspect ratio, so it's shown whole without letterboxing, and is never wider than
  // the image's own pixels, so it's never scaled up
  function setSize(width, height) {
    if (!width || !height) return;
    dialog.style.setProperty('--aspect', String(width / height));
    dialog.style.setProperty('--image-width', `${width / devicePixelRatio}px`);
  }

  function open(item) {
    viewerOpen = true;
    updateClips();

    const source = item.tagName === 'IMG' ? item : item.querySelector('img');
    const image = document.createElement('img');
    setSize(source.naturalWidth, source.naturalHeight);
    image.addEventListener('load', () => setSize(image.naturalWidth, image.naturalHeight));
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    frame.appendChild(image);

    const text = captionFor(item);
    const number = text && figureNumber(item);
    caption.textContent = '';
    if (number) {
      const label = document.createElement('span');
      label.className = 'viewer-figure';
      label.textContent = `Fig. ${number}`;
      caption.append(label);
    }
    caption.append(text);
    caption.hidden = !text;
    dialog.showModal();
  }

  items.forEach((item) => {
    item.classList.add('viewable');
    item.addEventListener('click', (event) => {
      // A carousel slide is wider than a square or tall image in it, and the space beside the image is empty page,
      // so only the image itself opens the viewer
      if (item.closest('.carousel') && event.target.tagName !== 'IMG') return;
      open(item);
    });
  });

  dialog.querySelector('.viewer-close').addEventListener('click', () => dialog.close());
  // Clicking anywhere but the image or its caption closes the viewer. The dialog itself can be wider than the image
  // (a square or tall image is limited by the window's height, not its width), so clicks on the dialog's empty sides
  // count as outside too, not just clicks on the backdrop.
  dialog.addEventListener('click', (event) => {
    if (!event.target.closest('.viewer-frame, .viewer-caption, .viewer-close')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    frame.textContent = '';
    viewerOpen = false;
    updateClips();
  });
}
