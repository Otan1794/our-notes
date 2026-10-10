/** Curated palette: every colour is tuned to look good as a soft tint behind frosted glass. */
export const CATEGORY_COLORS = [
  { name: 'Teal', hex: '#2C5C5F' },
  { name: 'Coral', hex: '#E2725B' },
  { name: 'Amber', hex: '#C9A227' },
  { name: 'Blue', hex: '#5B7DB1' },
  { name: 'Plum', hex: '#7A5C61' },
  { name: 'Sage', hex: '#6B8F71' },
  { name: 'Rose', hex: '#C75B7A' },
  { name: 'Violet', hex: '#7C6BB0' },
  { name: 'Sky', hex: '#3E9BB8' },
  { name: 'Slate', hex: '#5E6B7A' }
] as const;

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0].hex;

/** Quick-pick emoji for the icon field (typing or pasting any emoji also works). */
export const SUGGESTED_EMOJI = ['📌', '🍜', '✅', '🎬', '💡', '🛍️', '✈️', '🏠', '📚', '🎵', '🎮', '💬', '❤️', '⭐'];

/** "#E2725B" -> "226 114 91", the form CSS needs for rgb(var(--cat-rgb) / alpha). */
export function categoryRgb(color: string): string {
  let hex = color.trim().replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) hex = DEFAULT_CATEGORY_COLOR.slice(1);
  const n = parseInt(hex, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Keeps just the first character the user typed or pasted (one emoji, even multi-part ones). */
export function firstGrapheme(value: string): string {
  const [first] = new Intl.Segmenter().segment(value.trim());
  return first?.segment ?? '';
}
