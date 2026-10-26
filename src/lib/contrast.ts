/**
 * WCAG 2.2 Relative Luminance and Contrast Ratio Calculation
 * Standard: WCAG 2.2 Success Criterion 1.4.3 (Contrast Minimum)
 */

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function adjustColorChannel(val: number): number {
  return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
}

export function calculateLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const rAdj = adjustColorChannel(r);
  const gAdj = adjustColorChannel(g);
  const bAdj = adjustColorChannel(b);
  return 0.2126 * rAdj + 0.7152 * gAdj + 0.0722 * bAdj;
}

export function calculateContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lum1 = calculateLuminance(foregroundHex);
  const lum2 = calculateLuminance(backgroundHex);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}
