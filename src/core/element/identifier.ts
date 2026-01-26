/**
 * Element identifier - generates human-readable element descriptions
 */

const MAX_TEXT_LENGTH = 40;

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncate(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 3) + '...';
}

/**
 * Get visible text content from an element, excluding hidden elements
 */
function getVisibleText(element: Element): string {
  // For input elements, use value or placeholder
  if (element instanceof HTMLInputElement) {
    return element.value || element.placeholder || '';
  }

  if (element instanceof HTMLTextAreaElement) {
    return element.value || element.placeholder || '';
  }

  // For select elements, use selected option text
  if (element instanceof HTMLSelectElement) {
    return element.options[element.selectedIndex]?.text || '';
  }

  // Get text content, excluding script and style
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll('script, style, [aria-hidden="true"]').forEach((el) => el.remove());

  return clone.textContent || '';
}

/**
 * Get ARIA label from element
 */
function getAriaLabel(element: Element): string | null {
  const label = element.getAttribute('aria-label');
  if (label) return label;

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) {
      return getVisibleText(labelElement);
    }
  }

  return null;
}

/**
 * Get label for form element
 */
function getFormLabel(element: Element): string | null {
  // Check for associated label via 'for' attribute
  const id = element.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
      return getVisibleText(label);
    }
  }

  // Check for wrapping label
  const parentLabel = element.closest('label');
  if (parentLabel) {
    // Get label text excluding the input itself
    const clone = parentLabel.cloneNode(true) as Element;
    clone.querySelectorAll('input, select, textarea').forEach((el) => el.remove());
    const text = clone.textContent?.trim();
    if (text) return text;
  }

  return null;
}

/**
 * Check if element contains only an SVG/icon
 */
function containsOnlyIcon(element: Element): boolean {
  const children = Array.from(element.children);
  if (children.length === 0) return false;

  const hasOnlySvg = children.every(
    (child) =>
      child.tagName === 'SVG' ||
      child.tagName === 'svg' ||
      child.classList.contains('icon') ||
      child.tagName === 'I'
  );

  const textContent = getVisibleText(element).trim();
  return hasOnlySvg && !textContent;
}

/**
 * Identify a button element
 */
function identifyButton(element: Element): string {
  const text = truncate(getVisibleText(element));
  if (text) {
    return `button "${text}"`;
  }

  const ariaLabel = getAriaLabel(element);
  if (ariaLabel) {
    return `button [${truncate(ariaLabel)}]`;
  }

  const title = element.getAttribute('title');
  if (title) {
    return `button [${truncate(title)}]`;
  }

  if (containsOnlyIcon(element)) {
    return 'icon button';
  }

  const type = element.getAttribute('type');
  if (type && type !== 'button') {
    return `${type} button`;
  }

  return 'button';
}

/**
 * Identify a link element
 */
function identifyLink(element: HTMLAnchorElement): string {
  const text = truncate(getVisibleText(element));
  if (text) {
    return `link "${text}"`;
  }

  const ariaLabel = getAriaLabel(element);
  if (ariaLabel) {
    return `link [${truncate(ariaLabel)}]`;
  }

  const href = element.getAttribute('href');
  if (href && href !== '#') {
    // Extract meaningful part of URL
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin === window.location.origin) {
        return `link to ${url.pathname}`;
      }
      return `link to ${url.hostname}`;
    } catch {
      return `link to ${truncate(href, 30)}`;
    }
  }

  if (containsOnlyIcon(element)) {
    return 'icon link';
  }

  return 'link';
}

/**
 * Identify an input element
 */
function identifyInput(element: HTMLInputElement): string {
  const type = element.type || 'text';
  const label = getFormLabel(element);
  const placeholder = element.placeholder;
  const name = element.name;
  const ariaLabel = getAriaLabel(element);

  // Build description
  let desc = '';

  if (label) {
    desc = `"${truncate(label)}"`;
  } else if (ariaLabel) {
    desc = `[${truncate(ariaLabel)}]`;
  } else if (placeholder) {
    desc = `"${truncate(placeholder)}"`;
  } else if (name) {
    desc = `[${name}]`;
  }

  // Special input types
  switch (type) {
    case 'submit':
      return `submit button${desc ? ' ' + desc : ''}`;
    case 'checkbox':
      return `checkbox${desc ? ' ' + desc : ''}`;
    case 'radio':
      return `radio${desc ? ' ' + desc : ''}`;
    case 'file':
      return `file input${desc ? ' ' + desc : ''}`;
    case 'search':
      return `search input${desc ? ' ' + desc : ''}`;
    case 'email':
      return `email input${desc ? ' ' + desc : ''}`;
    case 'password':
      return `password input${desc ? ' ' + desc : ''}`;
    case 'number':
      return `number input${desc ? ' ' + desc : ''}`;
    case 'tel':
      return `phone input${desc ? ' ' + desc : ''}`;
    case 'url':
      return `URL input${desc ? ' ' + desc : ''}`;
    case 'date':
    case 'datetime-local':
    case 'time':
      return `${type} input${desc ? ' ' + desc : ''}`;
    case 'range':
      return `slider${desc ? ' ' + desc : ''}`;
    case 'color':
      return `color picker${desc ? ' ' + desc : ''}`;
    default:
      return `text input${desc ? ' ' + desc : ''}`;
  }
}

/**
 * Identify a select element
 */
function identifySelect(element: HTMLSelectElement): string {
  const label = getFormLabel(element);
  const ariaLabel = getAriaLabel(element);
  const name = element.name;

  let desc = '';
  if (label) {
    desc = ` "${truncate(label)}"`;
  } else if (ariaLabel) {
    desc = ` [${truncate(ariaLabel)}]`;
  } else if (name) {
    desc = ` [${name}]`;
  }

  return `dropdown${desc}`;
}

/**
 * Identify a textarea element
 */
function identifyTextarea(element: HTMLTextAreaElement): string {
  const label = getFormLabel(element);
  const ariaLabel = getAriaLabel(element);
  const placeholder = element.placeholder;
  const name = element.name;

  let desc = '';
  if (label) {
    desc = ` "${truncate(label)}"`;
  } else if (ariaLabel) {
    desc = ` [${truncate(ariaLabel)}]`;
  } else if (placeholder) {
    desc = ` "${truncate(placeholder)}"`;
  } else if (name) {
    desc = ` [${name}]`;
  }

  return `text area${desc}`;
}

/**
 * Identify a heading element
 */
function identifyHeading(element: Element): string {
  const level = element.tagName.toLowerCase();
  const text = truncate(getVisibleText(element));
  return text ? `${level} "${text}"` : level;
}

/**
 * Identify a paragraph or text block
 */
function identifyTextBlock(element: Element, type: string): string {
  const text = truncate(getVisibleText(element), 50);
  return text ? `${type}: "${text}"` : type;
}

/**
 * Identify an image element
 */
function identifyImage(element: HTMLImageElement): string {
  const alt = element.alt;
  if (alt) {
    return `image "${truncate(alt)}"`;
  }

  const ariaLabel = getAriaLabel(element);
  if (ariaLabel) {
    return `image [${truncate(ariaLabel)}]`;
  }

  // Try to get meaningful part of src
  const src = element.src;
  if (src) {
    try {
      const url = new URL(src);
      const filename = url.pathname.split('/').pop();
      if (filename && !filename.includes('?')) {
        return `image "${truncate(filename, 30)}"`;
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  return 'image';
}

/**
 * Identify an SVG element
 */
function identifySvg(element: SVGElement): string {
  // Check if SVG is inside a button or link
  const interactiveParent = element.closest('button, a, [role="button"]');
  if (interactiveParent) {
    return 'icon';
  }

  const ariaLabel = getAriaLabel(element);
  if (ariaLabel) {
    return `graphic [${truncate(ariaLabel)}]`;
  }

  const title = element.querySelector('title');
  if (title?.textContent) {
    return `graphic "${truncate(title.textContent)}"`;
  }

  return 'icon';
}

/**
 * Identify a video element
 */
function identifyVideo(element: HTMLVideoElement): string {
  const ariaLabel = getAriaLabel(element);
  if (ariaLabel) {
    return `video [${truncate(ariaLabel)}]`;
  }

  return 'video';
}

/**
 * Identify a table cell
 */
function identifyTableCell(element: Element): string {
  const isHeader = element.tagName === 'TH';
  const text = truncate(getVisibleText(element), 30);
  const type = isHeader ? 'table header' : 'table cell';
  return text ? `${type}: "${text}"` : type;
}

/**
 * Identify a list item
 */
function identifyListItem(element: Element): string {
  const text = truncate(getVisibleText(element), 50);
  return text ? `list item: "${text}"` : 'list item';
}

/**
 * Identify a label element
 */
function identifyLabel(element: HTMLLabelElement): string {
  const text = truncate(getVisibleText(element));
  return text ? `label "${text}"` : 'label';
}

/**
 * Identify a generic container element
 */
function identifyContainer(element: Element): string {
  // Check for ARIA role
  const role = element.getAttribute('role');
  if (role) {
    return role;
  }

  // Check for common semantic meanings via class names
  const classList = Array.from(element.classList);
  const semanticClasses = ['header', 'footer', 'nav', 'sidebar', 'main', 'content', 'article', 'section', 'card', 'modal', 'dialog', 'menu', 'dropdown', 'panel', 'container', 'wrapper'];

  for (const cls of classList) {
    const lowerCls = cls.toLowerCase();
    for (const semantic of semanticClasses) {
      if (lowerCls.includes(semantic)) {
        return semantic;
      }
    }
  }

  // Check for data attributes that might indicate purpose
  const dataTestId = element.getAttribute('data-testid') || element.getAttribute('data-test-id');
  if (dataTestId) {
    return dataTestId.replace(/[-_]/g, ' ');
  }

  // Fall back to tag name
  return element.tagName.toLowerCase();
}

/**
 * Generate a human-readable identifier for any DOM element
 */
export function identifyElement(element: Element): string {
  const tagName = element.tagName.toLowerCase();

  // Buttons
  if (
    tagName === 'button' ||
    element.getAttribute('role') === 'button' ||
    (element instanceof HTMLInputElement &&
      (element.type === 'button' || element.type === 'submit' || element.type === 'reset'))
  ) {
    return identifyButton(element);
  }

  // Links
  if (tagName === 'a') {
    return identifyLink(element as HTMLAnchorElement);
  }

  // Form inputs
  if (tagName === 'input') {
    return identifyInput(element as HTMLInputElement);
  }

  if (tagName === 'select') {
    return identifySelect(element as HTMLSelectElement);
  }

  if (tagName === 'textarea') {
    return identifyTextarea(element as HTMLTextAreaElement);
  }

  // Headings
  if (/^h[1-6]$/.test(tagName)) {
    return identifyHeading(element);
  }

  // Text elements
  if (tagName === 'p') {
    return identifyTextBlock(element, 'paragraph');
  }

  if (tagName === 'span') {
    const text = truncate(getVisibleText(element));
    return text ? `text: "${text}"` : 'text';
  }

  if (tagName === 'code') {
    const text = truncate(getVisibleText(element), 30);
    return text ? `code: \`${text}\`` : 'code';
  }

  if (tagName === 'pre') {
    return 'code block';
  }

  if (tagName === 'blockquote') {
    return 'blockquote';
  }

  // Media
  if (tagName === 'img') {
    return identifyImage(element as HTMLImageElement);
  }

  if (tagName === 'svg') {
    return identifySvg(element as SVGElement);
  }

  if (tagName === 'video') {
    return identifyVideo(element as HTMLVideoElement);
  }

  if (tagName === 'audio') {
    return 'audio';
  }

  if (tagName === 'canvas') {
    return 'canvas';
  }

  if (tagName === 'iframe') {
    return 'iframe';
  }

  // Table elements
  if (tagName === 'th' || tagName === 'td') {
    return identifyTableCell(element);
  }

  if (tagName === 'tr') {
    return 'table row';
  }

  if (tagName === 'table') {
    return 'table';
  }

  // List elements
  if (tagName === 'li') {
    return identifyListItem(element);
  }

  if (tagName === 'ul') {
    return 'unordered list';
  }

  if (tagName === 'ol') {
    return 'ordered list';
  }

  // Label
  if (tagName === 'label') {
    return identifyLabel(element as HTMLLabelElement);
  }

  // Semantic elements
  if (tagName === 'nav') {
    return 'navigation';
  }

  if (tagName === 'header') {
    return 'header';
  }

  if (tagName === 'footer') {
    return 'footer';
  }

  if (tagName === 'main') {
    return 'main content';
  }

  if (tagName === 'aside') {
    return 'sidebar';
  }

  if (tagName === 'article') {
    return 'article';
  }

  if (tagName === 'section') {
    return 'section';
  }

  if (tagName === 'form') {
    return 'form';
  }

  if (tagName === 'figure') {
    return 'figure';
  }

  if (tagName === 'figcaption') {
    return 'caption';
  }

  // Generic container
  return identifyContainer(element);
}
