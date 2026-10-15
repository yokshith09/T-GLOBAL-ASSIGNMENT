export type Theme = "light" | "dark";
const KEY = "aurum-theme";

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function apply(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
}

/** Call once before render. Defaults to light unless the user chose dark before. */
export function initTheme(): Theme {
  const t = stored() ?? "light";
  apply(t);
  return t;
}

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
  apply(t);
}
