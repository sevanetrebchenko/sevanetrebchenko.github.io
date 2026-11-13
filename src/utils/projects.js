import { getCollection } from 'astro:content';

/**
 * Get all projects, sorted featured first, then by date (newest first).
 * Drafts are included only in dev, so placeholder entries can be previewed locally.
 */
export async function getPublishedProjects() {
  const projects = await getCollection('projects', ({ data }) => import.meta.env.DEV || !data.draft);
  return projects.sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    return b.data.date.valueOf() - a.data.date.valueOf();
  });
}

/**
 * Whether a project gets its own page: always for showcase projects, and for small ones
 * only when they have a write-up (otherwise the list links straight to their first link).
 */
export function hasPage(project) {
  return project.data.kind === 'showcase' || Boolean(project.body?.trim());
}

/**
 * Showcase projects that link to a post, either by listing it under `writing`
 * or by naming the series it belongs to.
 */
export function getProjectsForPost(projects, post) {
  return projects.filter((project) =>
    project.data.kind === 'showcase' &&
    (project.data.writing.includes(post.id) || (post.data.series && project.data.series === post.data.series.name)));
}

/**
 * Resolve a project link to { url, label, icon }, where icon is 'github', 'youtube' or 'external'.
 */
export function describeLink(link) {
  const host = new URL(link.url).hostname.replace(/^www\./, '');
  const known = {
    'github.com': { label: 'GitHub', icon: 'github' },
    'youtube.com': { label: 'YouTube', icon: 'youtube' },
    'youtu.be': { label: 'YouTube', icon: 'youtube' },
  }[host] ?? { label: host, icon: 'external' };
  return { url: link.url, label: link.label ?? known.label, icon: known.icon };
}
