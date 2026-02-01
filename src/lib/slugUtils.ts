/**
 * Converts a rule title to a URL-safe slug
 * @param title - The rule title
 * @returns URL-safe slug
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Checks if a string is a valid MongoDB ObjectId
 * @param str - String to check
 * @returns true if valid ObjectId, false otherwise
 */
export function isValidObjectId(str: string): boolean {
  return /^[0-9a-f]{24}$/.test(str);
}

/**
 * Determines if a URL parameter is an ID or slug
 * @param param - URL parameter (could be ID or slug)
 * @returns 'id' if it's a MongoDB ObjectId, 'slug' otherwise
 */
export function getParamType(param: string): 'id' | 'slug' {
  return isValidObjectId(param) ? 'id' : 'slug';
}
