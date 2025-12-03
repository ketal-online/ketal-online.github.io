export type DiceBearStyle =
  | "adventurer"
  | "adventurer-neutral"
  | "avataaars"
  | "avataaars-neutral"
  | "big-ears"
  | "big-ears-neutral"
  | "big-smile"
  | "bottts"
  | "bottts-neutral"
  | "croodles"
  | "croodles-neutral"
  | "fun-emoji"
  | "icons"
  | "identicon"
  | "initials"
  | "lorelei"
  | "lorelei-neutral"
  | "micah"
  | "miniavs"
  | "notionists"
  | "notionists-neutral"
  | "open-peeps"
  | "personas"
  | "pixel-art"
  | "pixel-art-neutral"
  | "shapes"
  | "thumbs";

export const defaultStyle: DiceBearStyle = "adventurer-neutral";

export function getAvatarUrl(
  seed: string,
  style: DiceBearStyle = defaultStyle,
  options: Record<string, string | number | boolean> = {}
): string {
  const params = new URLSearchParams();
  params.append("seed", seed);
  
  for (const [key, value] of Object.entries(options)) {
    params.append(key, String(value));
  }

  return `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`;
}
