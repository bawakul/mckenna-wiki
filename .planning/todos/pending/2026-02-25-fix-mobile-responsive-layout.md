---
created: 2026-02-25T14:04:34.387Z
title: Fix mobile responsive layout
area: ui
files:
  - src/components/NavBar.tsx
  - src/components/transcripts/TranscriptHeader.tsx
  - src/components/annotations/AnnotationSidebar.tsx
  - src/components/annotations/HighlightPopover.tsx
---

## Problem

Mobile view is broken. The app was built desktop-first and several key interfaces don't work well at mobile screen sizes: transcript reader layout, nav bar, annotation sidebar, highlight popover, and module selector. The app is now deployed publicly on Vercel so mobile visitors will see a broken experience.

## Solution

Responsive pass across core UI:
- Nav bar: hamburger menu or stacked layout at small breakpoints
- Transcript reader: adjust padding, timestamp gutter, paragraph width
- Annotation sidebar: bottom sheet or overlay instead of side panel on mobile
- Highlight popover / module selector: ensure they don't overflow viewport
- Modules page: single column grid on mobile (already has sm:grid-cols-2)
