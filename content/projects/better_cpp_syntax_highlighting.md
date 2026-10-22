---
title: "Better C++ Syntax Highlighting"
description: "A Clang LibTooling tool that annotates C++ snippets with semantic information, so this site’s code blocks know a type from a namespace from a function."
tags: ["C++", "Clang", "LibTooling"]
date: 2025-06-12
featured: true
draft: true
caption: "[Caption: what we’re looking at.]"
links:
  - url: https://github.com/sevanetrebchenko
  - url: https://www.youtube.com/watch?v=placeholder
  - url: https://example.com
    label: "Live demo"
lastModified: 2025-07-03
series: "Better C++ Syntax Highlighting"
writing:
  - better_cpp_syntax_highlighting/1_intro
  - better_cpp_syntax_highlighting/6_templates
  - better_cpp_syntax_highlighting/8_qualifiers
---

## Why

Browser highlighters work from tokens, not meaning.
In C++ that means a type, a namespace, an enum constant and a function often end up the same color, because telling them apart needs the compiler's view of the code.

## How it works

Each snippet is parsed with Clang, and a set of AST visitors walks the tree and records what every name actually refers to.
Those annotations are written back inline, and the site's highlighter turns them into styles.

<figure>
  <div class="figure-placeholder thumb-placeholder" role="img" aria-label="Pipeline diagram placeholder"></div>
  <figcaption>[Diagram: snippet → Clang AST → visitors → annotated source.]</figcaption>
</figure>

```cpp
typedef enum [[class-name,VkBorderColor]] {
    [[enum-value,VK_BORDER_COLOR_FLOAT_TRANSPARENT_BLACK]],
    [[enum-value,VK_BORDER_COLOR_INT_TRANSPARENT_BLACK]],
    // ...
} [[class-name,VkBorderColor]];
```

Visitors cover enums, namespaces, functions and operators, classes, templates and concepts, type references and qualifier chains.
Preprocessor directives are caught by hooking Clang's preprocessing stage, before they disappear from the AST.

## What was hard

[Two or three short paragraphs on the trickiest part, e.g. qualifier chains or templates. Link into the matching series post.]

<figure>
  <div class="figure-row">
    <div class="figure-placeholder thumb-placeholder" role="img" aria-label="Step 1 placeholder"></div>
    <div class="figure-placeholder thumb-placeholder" role="img" aria-label="Step 2 placeholder"></div>
    <div class="figure-placeholder thumb-placeholder" role="img" aria-label="Step 3 placeholder"></div>
  </div>
  <figcaption>(a) [first step], (b) [second step], (c) [third step].</figcaption>
</figure>

## Result

[Where it's used (every code block on this site), leading into the comparison below.]

<figure>
  <div class="figure-row">
    <div class="figure-placeholder thumb-placeholder" role="img" aria-label="Before: token-based highlighting placeholder"></div>
    <div class="figure-placeholder thumb-placeholder" role="img" aria-label="After: semantic highlighting placeholder"></div>
  </div>
  <figcaption>[The same snippet, before and after.]</figcaption>
</figure>

[A closing paragraph: what's next, or what you'd do differently.]
