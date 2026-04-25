/**
 * Utility functions for blending and managing colors for the interactive map.
 */

/**
 * Interpolates between two hex colors based on a given weight.
 * @param color1 The starting hex color (e.g., "#22c55e")
 * @param color2 The ending hex color (e.g., "#eab308")
 * @param weight The interpolation weight from 0.0 to 1.0
 * @returns The blended hex color
 */
export function blendHexColors(color1: string, color2: string, weight: number): string {
  // Ensure weight is between 0 and 1
  const w = Math.max(0, Math.min(1, weight));

  // Parse hex to RGB
  const parseHex = (hex: string) => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  };

  const rgb1 = parseHex(color1);
  const rgb2 = parseHex(color2);

  // Use square-root interpolation (linearizing light) to avoid "muddy" middle
  const r = Math.round(Math.sqrt(Math.pow(rgb1.r, 2) * (1 - w) + Math.pow(rgb2.r, 2) * w));
  const g = Math.round(Math.sqrt(Math.pow(rgb1.g, 2) * (1 - w) + Math.pow(rgb2.g, 2) * w));
  const b = Math.round(Math.sqrt(Math.pow(rgb1.b, 2) * (1 - w) + Math.pow(rgb2.b, 2) * w));

  // Convert back to hex
  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Returns an interpolated color based on a numerical risk score (0 to 2).
 * Score mapping:
 * 0 (Low Risk) = Green (#22c55e)
 * 1 (Moderate Risk) = Yellow (#eab308)
 * 2 (High Risk) = Red (#ef4444)
 *
 * @param averageScore The calculated average score between 0.0 and 2.0
 * @returns The resulting blended hex color
 */
export function getAveragedColor(averageScore: number): string {
  const GREEN = "#22c55e";
  const YELLOW = "#eab308";
  const RED = "#ef4444";

  if (averageScore <= 1) {
    // Blend between Green (0) and Yellow (1)
    return blendHexColors(GREEN, YELLOW, averageScore);
  } else {
    // Blend between Yellow (1) and Red (2)
    // Weight is shifted down by 1 since the interpolation expects 0.0 to 1.0
    return blendHexColors(YELLOW, RED, averageScore - 1);
  }
}
