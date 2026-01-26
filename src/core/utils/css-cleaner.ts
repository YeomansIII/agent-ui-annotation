/**
 * CSS class name cleaner - removes CSS module hashes and normalizes class names
 */

/** Pattern to match CSS module hash suffixes like _a1b2c3 or -a1b2c3 */
const CSS_MODULE_HASH_PATTERN = /[-_][a-zA-Z0-9]{5,}$/;

/** Pattern to match common hash patterns in class names */
const HASH_PATTERNS = [
  // Webpack/CSS Modules: component_abc123 or component-abc123
  /^(.+?)[-_][a-zA-Z0-9]{5,}$/,
  // Styled-components: sc-abc123
  /^sc-[a-zA-Z0-9]+$/,
  // Emotion: css-abc123
  /^css-[a-zA-Z0-9]+$/,
  // Tailwind JIT: arbitrary values like [color:red]
  /^\[.+\]$/,
];

/** Common utility class prefixes that should be kept as-is */
const UTILITY_PREFIXES = [
  'text-',
  'bg-',
  'flex',
  'grid',
  'p-',
  'px-',
  'py-',
  'm-',
  'mx-',
  'my-',
  'w-',
  'h-',
  'min-',
  'max-',
  'border',
  'rounded',
  'shadow',
  'opacity',
  'font-',
  'leading-',
  'tracking-',
  'space-',
  'gap-',
  'items-',
  'justify-',
  'self-',
  'overflow-',
  'z-',
  'cursor-',
  'transition',
  'transform',
  'scale-',
  'rotate-',
  'translate-',
  'animate-',
  'duration-',
  'ease-',
  'delay-',
  'hidden',
  'block',
  'inline',
  'relative',
  'absolute',
  'fixed',
  'sticky',
  'static',
  'top-',
  'right-',
  'bottom-',
  'left-',
  'inset-',
];

/**
 * Clean a single CSS class name by removing module hashes
 */
export function cleanClassName(className: string): string | null {
  const trimmed = className.trim();

  if (!trimmed) return null;

  // Skip utility classes (Tailwind, etc.)
  if (UTILITY_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return trimmed;
  }

  // Check for hash-only classes that should be removed entirely
  for (const pattern of HASH_PATTERNS.slice(1)) {
    if (pattern.test(trimmed)) {
      return null;
    }
  }

  // Try to extract the meaningful part before the hash
  const match = trimmed.match(HASH_PATTERNS[0]);
  if (match) {
    return match[1];
  }

  // Check for simple hash suffix pattern
  if (CSS_MODULE_HASH_PATTERN.test(trimmed)) {
    return trimmed.replace(CSS_MODULE_HASH_PATTERN, '');
  }

  return trimmed;
}

/**
 * Clean a list of class names, removing hashes and duplicates
 */
export function cleanClassList(classList: DOMTokenList | string[]): string[] {
  const classes = Array.isArray(classList) ? classList : Array.from(classList);
  const cleaned = new Set<string>();

  for (const className of classes) {
    const cleanedName = cleanClassName(className);
    if (cleanedName) {
      cleaned.add(cleanedName);
    }
  }

  return Array.from(cleaned);
}

/**
 * Get meaningful classes from an element (excludes hashes and common utilities)
 */
export function getMeaningfulClasses(element: Element): string[] {
  const cleaned = cleanClassList(element.classList);

  // Filter out single-character classes and very short ones
  return cleaned.filter((cls) => cls.length > 2);
}

/**
 * Get the first meaningful class from an element, suitable for CSS selectors
 */
export function getFirstMeaningfulClass(element: Element): string | null {
  const meaningful = getMeaningfulClasses(element);

  // Prefer classes that look like semantic names (not utilities)
  const semantic = meaningful.find(
    (cls) => !UTILITY_PREFIXES.some((prefix) => cls.startsWith(prefix))
  );

  return semantic || meaningful[0] || null;
}

/**
 * Format classes as a CSS class selector string
 */
export function formatClassSelector(classes: string[]): string {
  if (classes.length === 0) return '';
  return '.' + classes.join('.');
}
