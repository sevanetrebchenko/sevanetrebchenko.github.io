import times from '../data/last_modified_times.json';

/**
 * When a post or project was last modified: its `lastModified` frontmatter if set, otherwise the
 * time recorded by scripts/generate-metadata.js (last git commit, or file mtime if uncommitted).
 */
export function getLastModified(entry) {
  if (entry.data.lastModified) return entry.data.lastModified;
  const key = entry.filePath?.replace(/\\/g, '/').replace(/^content\//, '');
  return key && times[key] ? new Date(times[key]) : undefined;
}
