export function lightenColor(hex, amount = 0.3) {
  try {
    let col = hex.replace("#", "");
    if (col.length === 3) {
      col = col.split("").map(c => c + c).join("");
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + Math.round(255 * amount);
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * amount);
    let b = (num & 0x0000ff) + Math.round(255 * amount);

    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);

    return `rgba(${r}, ${g}, ${b}, 0.15)`; // semi-light background
  } catch {
    return "rgba(255, 247, 237, 0.5)"; // fallback
  }
}
