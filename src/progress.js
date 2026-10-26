export function loadReadGalaxies() {
  try {
    const value = JSON.parse(localStorage.getItem("universo21-read") || "[]");
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter((n) => Number.isInteger(n) && n >= 0 && n < 21),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
