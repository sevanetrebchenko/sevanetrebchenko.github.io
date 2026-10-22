# sevanetrebchenko.com

Personal site, built with [Astro](https://astro.build). Content lives in Markdown under `content/`:

- `content/blog/` — posts, shown under **Writing** (`/blog`)
- `content/projects/` — projects, shown under **Projects** (`/projects`)

A file's path (without `.md`) is its id and its URL: `content/blog/better_cpp_syntax_highlighting/2_enums.md` is served at `/blog/better_cpp_syntax_highlighting/2_enums`.

```sh
npm run dev      # local server at http://localhost:4321
npm run build    # production build into build/
```

## Post frontmatter

```yaml
---
title: "Better C++ Syntax Highlighting - Part 2: Enums"
abstract: "One or two sentences on what the post covers."
tags: ["c++", "clang", "libtooling"]
date: 2025-06-14
lastModified: 2025-07-14
draft: false
series:
  name: "Better C++ Syntax Highlighting"
  part: 2
---
```

| Field | Required | Description |
|---|---|---|
| `title` | yes | Post title. |
| `abstract` | yes | Summary shown under the title, in post lists, and as the page's meta description. |
| `tags` | yes | List of tags. They become filters on the Writing page. Use `[]` for none. |
| `date` | yes | Publish date (`YYYY-MM-DD`). Sets the post's order and its year group on the Writing page. |
| `lastModified` | no | Last update. Shown as "updated …" on the post, but only if it's at least 7 days after `date`. Leave it out to use the file's last git commit date instead (see [Last-modified dates](#last-modified-dates)). |
| `draft` | no | `true` hides the post everywhere, including the dev server. Defaults to `false`. |
| `series` | no | Marks the post as part of a series (see below). |

### Series

Posts with the same `series.name` are grouped into one series. Titles don't have to match; only the name does, so keep its spelling and capitalization identical in every part.

- `series.name`: the series name. The Writing page lists the series once under this name, linking to part 1, with a "Show all N parts" toggle.
- `series.part`: the part number, which sets the order of the parts.

If a part's title follows `Series Name - Part N: Subtitle`, only the subtitle is shown in parts lists and as the post's heading. Any other title is shown as-is.

On the Writing page, a series uses part 1's abstract, spans the dates of its first and last parts, and carries the tags of all its parts.

## Project frontmatter

```yaml
---
title: "Better C++ Syntax Highlighting"
description: "A sentence or two on what it is."
tags: ["C++", "Clang", "LibTooling"]
date: 2025-06-12
lastModified: 2025-07-03
thumbnail: "/images/projects/highlighting.png"
caption: "What the main image shows."
links:
  - url: https://github.com/sevanetrebchenko/...
  - url: https://example.com/demo
    label: "Live demo"
kind: showcase
featured: true
draft: false
series: "Better C++ Syntax Highlighting"
writing:
  - better_cpp_syntax_highlighting/1_intro
---
```

| Field | Required | Description |
|---|---|---|
| `title` | yes | Project name. |
| `description` | yes | Summary shown under the title, in project lists, and as the page's meta description. |
| `tags` | yes | List of technologies. They become filters on the Projects page. Use `[]` for none. |
| `date` | yes | Publish date (`YYYY-MM-DD`). Sets the year group on the Projects page and the order within it. |
| `lastModified` | no | Last update. Shown as "updated …" on the project page, but only if it's at least 7 days after `date`. Leave it out to use the file's last git commit date instead (see [Last-modified dates](#last-modified-dates)). |
| `thumbnail` | no | Image path, relative to `public/` (e.g. `/images/x.png`). Used on cards, in the list, and as the project page's main image. A striped placeholder is shown until there is one. |
| `caption` | no | Caption under the main image on the project page, numbered "Fig. 1". Figures in the write-up then continue from Fig. 2. |
| `links` | no | Buttons on the project page. GitHub and YouTube links get their own icon and label; anything else shows its domain. `label` overrides the text. |
| `kind` | no | `showcase` (default) gets a thumbnail and its own page. `small` has no page or thumbnail: its list entry links to its first `links` URL, if any. |
| `featured` | no | `true` sorts the project ahead of non-featured ones, so it shows on the landing page (which lists the first three showcase projects). |
| `draft` | no | `true` hides the project from the production build. Drafts still show on the dev server, so placeholders can be previewed. |
| `series` | no | Name of a blog series written about this project. Every post in that series links back to it with a "Related project" card. |
| `writing` | no | Post ids (paths under `content/blog/` without `.md`) listed under "Related writing" on the project page. Those posts also get the "Related project" card. |

## Last-modified dates

`npm run dev` and `npm run build` first run `scripts/generate-metadata.js`, which records when each content file last changed in `src/data/last_modified_times.json`:

- Committed files use the date of their last git commit.
- Files with uncommitted changes, or not yet committed, use the file's modified time.

A post or project without `lastModified` in its frontmatter uses that recorded date. Set `lastModified` when git's date is misleading, e.g. after a bulk edit or migration that didn't really update the content.

The deploy workflow checks out the full git history (`fetch-depth: 0`) so commit dates are available in CI.

## Writing the body

- `##` and `###` headings make up the contents list (a sidebar on wide screens, a collapsible box otherwise).
- Reading time is worked out from the body, so there's nothing to set for it.
