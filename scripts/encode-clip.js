// Encodes a capture into the files a clip needs on the site (see src/utils/media.js):
//
//   node scripts/encode-clip.js <input> <public path without extension> [options]
//   node scripts/encode-clip.js capture.mp4 projects/cs350/gjk-courtyard --start 2 --duration 8
//
// Writes, under public/:
//   <path>.mp4       H.264, up to 2560 wide
//   <path>.jpg       poster frame, 1280 wide
//
// Options: --start <s>, --duration <s>, --poster-at <s> (from the trimmed start, default 0),
//          --width <px> (video, default 2560).
// Uses ffmpeg from $FFMPEG, or `ffmpeg` on PATH. Audio is dropped: clips always play muted.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const positional = [];
const options = { start: null, duration: null, 'poster-at': '0', width: '2560' };
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) options[args[i].slice(2)] = args[++i];
  else positional.push(args[i]);
}

const [input, publicPath] = positional;
if (!input || !publicPath) {
  console.error('Usage: node scripts/encode-clip.js <input> <public path without extension> [--start s] [--duration s] [--poster-at s] [--width px]');
  process.exit(1);
}

const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const base = path.join('public', publicPath);
fs.mkdirSync(path.dirname(base), { recursive: true });

const trim = [
  ...(options.start ? ['-ss', options.start] : []),
  '-i', input,
  ...(options.duration ? ['-t', options.duration] : []),
];
// Never upscale; keep dimensions even for the encoders. Video goes out as BT.709 (tagged): browsers decode untagged
// video as BT.709, and ffmpeg's default BT.601 matrix shifts colors. Untagged input is read as BT.601 (how ffmpeg
// wrote it), tagged input by its tags.
const scale = (width) => `scale='min(${width},iw)':-2:out_color_matrix=bt709:out_range=tv,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv`;
const stillScale = (width) => `scale='min(${width},iw)':-2`;
const bt709 = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];

function run(label, outputArgs, output) {
  console.log(`${label}: ${output}`);
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...trim, ...outputArgs, output], { stdio: 'inherit' });
}

const h264 = (crf) => ['-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', ...bt709, '-movflags', '+faststart', '-an'];

run('video', ['-vf', scale(options.width), ...h264('16')], `${base}.mp4`);
run('poster', ['-ss', options['poster-at'], '-frames:v', '1', '-vf', stillScale(1280), '-q:v', '3'], `${base}.jpg`);

for (const suffix of ['.mp4', '.jpg']) {
  console.log(`${(fs.statSync(base + suffix).size / 1024).toFixed(0).padStart(6)} KB  ${base}${suffix}`);
}
