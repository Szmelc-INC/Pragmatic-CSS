---
name: pragmatic-ui-builder
description: >
  Build professional, accessible WebUIs (dashboards, admin panels, monitoring
  consoles, AI chat frontends, config screens) using Pragmatic UI (pui) — a
  dependency-free design system: OKLCH tokens, classless base styling, 30+
  components, CSS-only interactivity, optional tiny JS layer and a Tailwind v4
  bridge. Also includes a restricted-renderer mode (inline-styles-only HTML)
  for chat surfaces that render raw HTML but block classes, JS and external
  assets. Decides layout, components and emphasis automatically.
---

# Pragmatic UI Builder

You build WebUIs the pragmatic way: **semantic HTML first, tokens second, classes
third, JavaScript last.** Everything you emit must survive without JS, degrade
gracefully in restricted renderers, and look like one coherent product — dark-first
ops-professional, never noisy.

## The System In One Paragraph

`pui.css` is a single dependency-free stylesheet organized in cascade layers
(`tokens → base → components → utilities`):

- **base** styles *bare HTML* — `<button>`, `<input>`, `<table>`, `<details>`,
  `<dialog>`, `<pre>`, headings — so any page instantly looks consistent.
- **components** are opt-in classes (`.btn`, `.card`, `.badge`, `.alert`,
  `.timeline`, …).
- **tokens** are `--pui-*` CSS variables; every color is OKLCH derived from
  `--pui-hue`, so a theme is one variable. Soft variants are computed at runtime
  via `color-mix()` — never hardcode hex values in components.
- **themes**: dark is the default look; `html[data-theme="light"]` forces light,
  no attribute follows `prefers-color-scheme`; `html[data-hue="…"]` retints the
  accent; `html[data-density="compact|comfort"]` rescales spacing.
- The optional `pui.js` adds: theme toggle (`[data-theme-toggle]`), dialogs
  (`[data-open]`), toasts (`pui.toast()`), tabs (`role="tablist"`), a ⌘K command
  palette (`dialog.cmdk`), copy buttons (`[data-copy]`), sidebar collapse
  (`[data-sidebar-toggle]`).

## Hard Rules (non-negotiable)

1. **Semantic HTML before classes.** A `<table>` is a table; a `<details>` is an
   accordion. Never wrap a `<div role="button">` where a `<button>` works.
2. **One accent, few statuses.** Use `--pui-accent` for primary actions, and the
   status colors (`ok/warn/danger/info`) *only* for their meanings. No rainbow UIs.
3. **Restraint on effects.** Max one shadow layer on emphasis elements; motion is
   150ms `--pui-ease`; respect `prefers-reduced-motion` (the stylesheet already does).
4. **Accessibility is part of the markup, not an add-on:** label every input, pair
   tabs with `role`/`aria-selected`/`aria-controls`, give dialogs a title, keep
   contrast AA (the tokens do this — don't fight them), never remove `:focus-visible`.
5. **No external assets.** System font stacks only (`--pui-font-sans/-mono`), inline
   SVG icons or emoji, no CDN links, no webfonts.
6. **Numbers are tabular.** Data uses `.mono`/`.num` / `--pui-font-mono` with
   `font-variant-numeric: tabular-nums` (pui applies it for you in metric/table classes).

## Layout Decision Framework

For a **WebUI application**, use the app shell:

```html
<div class="app-shell">
  <header class="topbar">
    <button class="btn btn-ghost btn-icon" data-sidebar-toggle>☰</button>
    <a class="topbar-brand" href="/">Brand</a>
    <div class="topbar-actions">
      <button class="btn btn-icon btn-ghost" data-theme-toggle>◐</button>
    </div>
  </header>
  <aside class="sidebar">
    <ul class="sidebar-nav">
      <li class="sidebar-label">Section</li>
      <li><a class="sidebar-item" href="#" aria-current="page">📄 Item</a></li>
    </ul>
    <div class="sidebar-footer">node · version</div>
  </aside>
  <div class="sidebar-scrim"></div>
  <main class="app-main">
    <!-- page title row: h1 + actions (btn btn-primary) -->
    <!-- KPI row: .grid.cols-4 of .card + .metric-* -->
    <!-- content: .grid two columns (2fr/1fr) of cards -->
  </main>
</div>
```

Priority order when composing content: **page header → KPI/metric row → alerts →
primary data (table/chart/log) → timeline or side cards → progressive disclosure
(`<details>`) → footer status bar.** Never force all of them; 3–5 blocks per view.

For a **single document/settings page**: breadcrumbs (`ol.breadcrumb`) → `h1` +
actions → `tabs` → cards. For a **command/list surface**: search input + `menu` or
`dialog.cmdk`.

## Component Recipes

Buttons — hierarchy by noise: `btn-primary` (one per view) > `btn` > `btn-soft` >
`btn-ghost` > `btn-danger` (destructive only). Sizes `btn-sm/btn-lg/btn-icon`.

```html
<button class="btn btn-primary">Deploy</button>
<button class="btn">Restart</button>
<button class="btn btn-ghost">Dismiss</button>
<button class="btn btn-danger">Destroy</button>
<button class="btn" aria-busy="true">Working…</button>
```

Status & data:

```html
<span class="badge badge-ok"><span class="dot dot-pulse"></span>operational</span>
<div class="metric-label">CPU</div><div class="metric-value accent">12%</div>
<div class="progress sm"><div class="progress-fill" style="width:12%"></div></div>
<div class="alert alert-warn"><div><div class="alert-title">…</div><p class="alert-body">…</p></div></div>
```

Timeline & log (the ops DNA):

```html
<ul class="timeline">
  <li class="ok"><div class="t-time">08:44</div><div class="t-body">Deploy finished.</div></li>
  <li class="warn"><div class="t-time">08:32</div><div class="t-body">Threshold crossed.</div></li>
</ul>
<div class="log">
  <div class="log-line"><span class="log-time">08:44:02</span><span><span class="lvl-ok">OK</span>&nbsp; deploy finished</span></div>
</div>
```

Forms: wrap in `.field` (label + control + `.hint`); validation uses
`.input-error` + `.hint-error`; toggles are `<input type="checkbox" class="switch">`;
bare checkboxes/radios/ranges already theme via `accent-color`.

Tables: `.table-wrap > table.table`; `th` for headers, `.num` for numeric columns,
row actions as `btn btn-ghost btn-sm`. Zebra: `.table-zebra`; sticky head: `.table-sticky`.

Overlays — choose the most native tool:

| Need | Use |
|---|---|
| Modal | `<dialog>` + `[data-open="id"]` / `[data-close]` |
| Dropdown menu | `<details class="dropdown"><summary>…</summary><div class="dropdown-panel menu">` (zero JS) or `[popover]` |
| Tooltip | `data-tip="…"` (top) / `data-tip-pos="bottom"` |
| Toast | `pui.toast("msg", { title, type: "ok|warn|danger|info" })` |
| Command palette | `<dialog class="cmdk">` + `.cmdk-input/.cmdk-list/.cmdk-item[data-cmd|data-href]`, opens on ⌘K |

Tabs (JS mode): `div.tabs[role=tablist] > button.tab[aria-selected][aria-controls]`
+ `div[role=tabpanel]`. Tabs (zero-JS mode): the `.tabset` radio pattern.

## Restricted Renderer Mode (chat surfaces, e.g. grok.com)

Some chat clients render raw HTML but strip classes, JS, and external assets.
When the output surface is such a renderer:

1. Paste **raw HTML** as the first character of the block — never inside code fences.
2. **Inline styles only.** Recreate the palette with hex stand-ins of the tokens:
   bg `#0f172a`, card `#1e293b`, border `#334155`, text `#e2e8f0`, muted `#94a3b8`,
   accent `#60a5fa`/`#a78bfa`, ok `#34d399`, warn `#fbbf24`, danger `#dc2626`.
3. Interactivity limited to `<details><summary>` and checkbox+`~` sibling toggles.
   No `<script>`, no `onclick`, no iframes.
4. `<style>` blocks leak as visible plaintext there — avoid or keep minified; accept
   the leak only for a critical animation.
5. Same taste rules: 3–4 rich blocks max, then clean markdown. Header → metrics →
   status → timeline → accordion → footer.

## Anti-Patterns (do not emit)

- Inline `style=""` on elements inside a normal WebUI (use tokens/classes).
- Gradient text or glow titles outside a deliberate hero.
- More than one `btn-primary` per view; danger-colored anything that isn't destructive.
- Custom dropdowns when `<select>` or `<details class="dropdown">` suffices.
- `!important` fights, `z-index` above 100, pixel-perfect fixed heights on text.
- Reimplementing components that already exist (progress bars via text, fake switches).

## Source Of Truth

- Component reference & live playground: `docs/index.html`
- Full application examples: `docs/demo-dashboard.html`, `docs/demo-admin.html`,
  `docs/demo-chat.html`
- Tokens: `src/pui.css` (`@layer tokens`) · behaviors: `src/pui.js`
- Tailwind v4: `tailwind/pui-theme.css`
