export function createSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // replace spaces & special chars with hyphen
    .replace(/^-+|-+$/g, "");    // remove leading/trailing hyphens
}