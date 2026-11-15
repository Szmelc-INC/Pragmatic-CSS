/* ==========================================================================
   Pragmatic UI (pui) — behavior layer
   --------------------------------------------------------------------------
   Optional. The design system is fully usable without this file: everything
   here is progressive enhancement over native HTML (dialog, popover,
   details). Include it and you get: theme switching, keyboard-driven tabs,
   toasts, a ⌘K command palette, declarative dialogs/menus, copy buttons and
   a collapsible sidebar.

   Usage:
     <script type="module" src="pui.js"></script>
     or (classic): <script src="pui.iife.js"></script>  → window.pui

   Declarative hooks:
     [data-theme-toggle]            → switch light/dark (persists)
     [data-hue="250"]  on <html>    → accent hue preset
     [data-open="dialog-id"]        → open <dialog id=dialog-id>
     [data-close]                   → close surrounding dialog
     [data-menu="popover-id"]       → toggleShow [popover id=popover-id]
     [data-copy="selector"|text]    → copy text to clipboard
     [data-cmdk="id"]               → button opening <dialog class=cmdk id>
     role="tablist" / role="tab"    → keyboard nav + panel switching
     [data-sidebar-toggle]          → collapse/expand .sidebar (desktop),
                                      drawer (mobile), persists
   API:
     pui.toast(message, { title, type, duration })
     pui.theme(force?) / pui.hue
     pui.openDialog(el) / pui.closeDialog(el)
   ========================================================================== */

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

/* ---- theme ---------------------------------------------------------------- */

function applyTheme(mode) {
  if (mode === "light" || mode === "dark") {
    document.documentElement.dataset.theme = mode;
  } else {
    delete document.documentElement.dataset.theme; // follow the system
  }
}

function theme(force) {
  if (force) {
    store.set("pui-theme", force);
    applyTheme(force);
    return force;
  }
  const cur = document.documentElement.dataset.theme;
  const next =
    !cur
      ? window.matchMedia("(prefers-color-scheme: light)").matches ? "dark" : "light"
      : cur === "light" ? "dark" : "light";
  store.set("pui-theme", next);
  applyTheme(next);
  return next;
}

function initTheme() {
  // precedence: stored user choice > attribute already on <html> (URL param,
  // SSR, head snippet) > no attribute = follow prefers-color-scheme
  const stored = store.get("pui-theme");
  if (stored) applyTheme(stored);
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (btn) theme();
  });
}

/* ---- tabs -------------------------------------------------------------------- */

function initTabs() {
  const activate = (tab) => {
    const list = tab.closest('[role="tablist"]');
    if (!list) return;
    for (const t of list.querySelectorAll('[role="tab"]')) {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls") ?? "");
      if (panel) panel.hidden = !selected;
    }
    tab.focus({ preventScroll: true });
  };

  document.addEventListener("click", (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) activate(tab);
  });

  document.addEventListener("keydown", (e) => {
    const tab = e.target.closest?.('[role="tab"]');
    if (!tab) return;
    const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    const i = tabs.indexOf(tab);
    const map = {
      ArrowRight: (i + 1) % tabs.length,
      ArrowLeft: (i - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (e.key in map) {
      e.preventDefault();
      activate(tabs[map[e.key]]);
    }
  });
}

/* ---- dialogs --------------------------------------------------------------------- */

function openDialog(el) {
  const d = typeof el === "string" ? document.getElementById(el) : el;
  if (!d || d.open) return;
  if (d.tagName === "DIALOG") d.showModal();
  else d.show?.();
}
function closeDialog(el) {
  const d = typeof el === "string" ? document.getElementById(el) : el;
  d?.close?.();
}

function initDialogs() {
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener) {
      const d = document.getElementById(opener.dataset.open);
      if (d && !d.open) (d.tagName === "DIALOG" ? d.showModal() : d.showPopover?.());
    }
    if (e.target.closest("[data-close]")) {
      e.target.closest("dialog, [popover]")?.close?.();
    }
    // click on the backdrop (the dialog element itself) closes
    const dialog = e.target.closest("dialog");
    if (dialog?.open && e.target === dialog && dialog.classList.contains("cmdk") === false) {
      // only when the dialog has no padding-box hit — use rect check
      const r = dialog.getBoundingClientRect();
      const inside =
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dialog.close();
    }
  });
}

/* ---- menus (popover API) ------------------------------------------------------------ */

function initMenus() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-menu]");
    if (!btn) return;
    const menu = document.getElementById(btn.dataset.menu);
    if (!menu) return;
    if (menu.togglePopover) menu.togglePopover();
    else menu.hidden = !menu.hidden;
  });
}

/* ---- toasts ------------------------------------------------------------------------------ */

let toastStack;

function toast(message, { title, type = "accent", duration = 4000 } = {}) {
  if (!toastStack) {
    toastStack = document.createElement("div");
    toastStack.className = "toast-stack";
    document.body.appendChild(toastStack);
  }
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.setAttribute("role", "status");
  const body = document.createElement("div");
  body.className = "toast-body";
  if (title) {
    const t = document.createElement("div");
    t.className = "toast-title";
    t.textContent = title;
    body.appendChild(t);
  }
  const m = document.createElement("div");
  m.className = "toast-msg";
  m.textContent = message;
  body.appendChild(m);
  el.appendChild(body);
  const x = document.createElement("button");
  x.className = "toast-close";
  x.setAttribute("aria-label", "Dismiss");
  x.textContent = "✕";
  x.addEventListener("click", () => dismiss());
  el.appendChild(x);
  toastStack.appendChild(el);

  let done = false;
  function dismiss() {
    if (done) return;
    done = true;
    el.dataset.exiting = "";
    el.addEventListener("transitionend", () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400); // transitionend safety net
  }
  if (duration > 0) setTimeout(dismiss, duration);
  return { el, dismiss };
}

/* ---- command palette ------------------------------------------------------------------------- */

function bindCmdk(cmdk) {
  if (cmdk.dataset.bound) return;
  cmdk.dataset.bound = "1";
  const input = cmdk.querySelector(".cmdk-input");
  const list = cmdk.querySelector(".cmdk-list");
  const items = () => [...list.querySelectorAll(".cmdk-item")];

  input?.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    let first = true;
    for (const item of items()) {
      const hit = !q || item.textContent.toLowerCase().includes(q);
      item.hidden = !hit;
      if (hit && first) {
        item.setAttribute("aria-selected", "true");
        first = false;
      } else {
        item.removeAttribute("aria-selected");
      }
    }
    list.querySelector(".cmdk-empty")?.toggleAttribute("hidden", !first);
  });

  cmdk.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const sel = list.querySelector('.cmdk-item[aria-selected="true"]:not([hidden])');
      if (sel) runCmd(sel);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const visible = items().filter((i) => !i.hidden);
    if (!visible.length) return;
    let idx = visible.findIndex((i) => i.getAttribute("aria-selected") === "true");
    idx = e.key === "ArrowDown" ? (idx + 1) % visible.length : (idx - 1 + visible.length) % visible.length;
    visible.forEach((i) => i.removeAttribute("aria-selected"));
    visible[idx].setAttribute("aria-selected", "true");
    visible[idx].scrollIntoView({ block: "nearest" });
    input?.focus();
  });

  // reset filter each time the palette opens
  cmdk.addEventListener("open", () => {
    if (input) input.value = "";
    for (const item of items()) {
      item.hidden = false;
      item.removeAttribute("aria-selected");
    }
  });
}

function openCmdk(cmdk) {
  cmdk.showModal();
  cmdk.querySelector(".cmdk-input")?.focus();
}

function initCmdk() {
  // bind every palette at boot so filtering works regardless of how the
  // dialog was opened (⌘K, [data-cmdk], or a plain showModal())
  for (const cmdk of document.querySelectorAll("dialog.cmdk")) bindCmdk(cmdk);

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const cmdk = document.querySelector("dialog.cmdk");
      if (cmdk) cmdk.open ? cmdk.close() : openCmdk(cmdk);
    }
    if (e.key === "Escape") {
      document.querySelector("dialog.cmdk[open]")?.close();
    }
  });

  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-cmdk]");
    if (opener) {
      const cmdk = document.getElementById(opener.dataset.cmdk);
      if (cmdk) openCmdk(cmdk);
    }
    const item = e.target.closest(".cmdk-item");
    if (item && item.closest("dialog.cmdk")?.open) {
      runCmd(item);
    }
  });
}

function runCmd(item) {
  item.closest("dialog.cmdk")?.close();
  const action = item.dataset.cmd;
  const href = item.dataset.href;
  if (href) location.assign(href);
  else if (action) window.puiActions?.[action]?.(action);
}

/* ---- copy buttons ------------------------------------------------------------------------------ */

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function initCopy() {
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const sel = btn.dataset.copy;
    const target = sel && sel !== "" ? document.querySelector(sel) : null;
    const text = target ? (target.value ?? target.textContent) : btn.dataset.copyText ?? "";
    const ok = await copyText(text.trim());
    const label = btn.querySelector("[data-copy-label]");
    if (ok) {
      btn.dataset.tip = "Copied";
      const old = label?.textContent;
      if (label) label.textContent = "Copied";
      setTimeout(() => {
        if (label && old) label.textContent = old;
      }, 1200);
    }
  });
}

/* ---- sidebar -------------------------------------------------------------------------------------- */

function initSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;
  const KEY = "pui-sidebar";
  if (store.get(KEY) === "collapsed" && window.matchMedia("(min-width: 861px)").matches) {
    sidebar.dataset.collapsed = "";
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sidebar-toggle]");
    if (!btn) return;
    if (window.matchMedia("(max-width: 860px)").matches) {
      sidebar.classList.toggle("sidebar-open");
    } else if (sidebar.dataset.collapsed !== undefined) {
      delete sidebar.dataset.collapsed;
      store.set(KEY, "open");
    } else {
      sidebar.dataset.collapsed = "";
      store.set(KEY, "collapsed");
    }
  });
  // scrim click closes the mobile drawer
  const scrim = document.querySelector(".sidebar-scrim");
  scrim?.addEventListener("click", () => sidebar.classList.remove("sidebar-open"));
}

/* ---- boot --------------------------------------------------------------------------------------------- */

function autoInit() {
  initTheme();
  initTabs();
  initDialogs();
  initMenus();
  initCmdk();
  initCopy();
  initSidebar();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}

export const pui = {
  toast,
  theme,
  openDialog,
  closeDialog,
  copyText,
  get hue() {
    return getComputedStyle(document.documentElement).getPropertyValue("--pui-hue").trim();
  },
  set hue(v) {
    document.documentElement.style.setProperty("--pui-hue", String(v));
  },
};

// classic-script convenience: inline handlers like onclick="pui.toast(…)"
// work without an import (mirrors the IIFE build's window.pui)
window.pui = pui;

export default pui;
