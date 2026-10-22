import { globSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';

// Collect last-modified timestamps for all content files.
// Output: src/data/last_modified_times.json  —  { [contentPath]: isoDateString }
//
// Committed files use the date of their last git commit, since a fresh checkout (as in CI) resets every
// file's mtime. Files with uncommitted changes, untracked files, or anything outside a git repo fall back
// to the filesystem mtime, so local edits show up before they're committed.
// CI needs the full history for this (actions/checkout with `fetch-depth: 0`).

const contentDir = 'content';
const files = globSync(`${contentDir}/**/*.md`).map((file) => file.replace(/\\/g, '/'));

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

// Paths with uncommitted changes or not tracked at all
const status = git(['status', '--porcelain', '--untracked-files=all', '--', contentDir]);
const dirty = new Set((status ?? '').split('\n').filter(Boolean).map((line) => line.slice(3).trim().replace(/^"|"$/g, '')));

const result = {};
for (const file of files) {
  const committed = status !== null && !dirty.has(file) ? git(['log', '-1', '--format=%cI', '--', file])?.trim() : null;
  const time = committed ? new Date(committed) : statSync(file).mtime;
  result[relative(contentDir, file).replace(/\\/g, '/')] = time.toISOString();
}

writeFileSync('src/data/last_modified_times.json', JSON.stringify(result, null, 2) + '\n');
