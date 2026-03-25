import { globSync, writeFileSync, statSync } from 'node:fs';
import { relative } from 'node:path';

// Collect filesystem last-modified timestamps for all content files.
// Output: src/data/last_modified_times.json  —  { [contentPath]: isoDateString }

const contentDir = 'content';
const files = globSync(`${contentDir}/**/*.md`);
const result = {};

for (const file of files) {
  const { mtime } = statSync(file);
  const key = relative(contentDir, file).replace(/\\/g, '/');
  result[key] = mtime.toISOString();
}

writeFileSync('src/data/last_modified_times.json', JSON.stringify(result, null, 2) + '\n');
