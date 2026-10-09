export const DEFAULT_ACCENT = "#18181b";

const ACCENT_PATTERN = /^#[0-9a-f]{6}$/;

/** True for a colour written as lower-case '#rrggbb'. */
export function isAccent(colour: string): boolean {
  return ACCENT_PATTERN.test(colour);
}

function linear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance of a '#rrggbb' colour, from 0 (black) to 1 (white). */
export function luminance(colour: string): number {
  const red = parseInt(colour.slice(1, 3), 16);
  const green = parseInt(colour.slice(3, 5), 16);
  const blue = parseInt(colour.slice(5, 7), 16);
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

// Below this luminance white text has more contrast than black text.
const WHITE_TEXT_BELOW = 0.179;

/** Black or white, whichever is easier to read on the given background. */
export function textColourOn(background: string): "#000000" | "#ffffff" {
  return luminance(background) < WHITE_TEXT_BELOW ? "#ffffff" : "#000000";
}
