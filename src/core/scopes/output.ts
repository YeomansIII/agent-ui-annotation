/**
 * Markdown output generation for scopes
 */

import type { Scope, OutputLevel, EnvironmentInfo } from '../types';
import { formatStyles } from '../element/styles';

/**
 * Get environment info for forensic output
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  return {
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    devicePixelRatio: window.devicePixelRatio,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    scrollPosition: {
      x: window.scrollX,
      y: window.scrollY,
    },
  };
}

/**
 * Generate compact output for a single scope
 * Format: `1. **button "Save"**: Change color to blue`
 */
function generateCompactScope(scope: Scope): string {
  const element = scope.elementInfo.humanReadable;
  const comment = scope.comment || '(no comment)';
  return `${scope.number}. **${element}**: ${comment}`;
}

/**
 * Generate standard output for a single scope
 */
function generateStandardScope(scope: Scope): string {
  const lines: string[] = [];

  lines.push(`### ${scope.number}. ${scope.elementInfo.humanReadable}`);
  lines.push(`**Location:** ${scope.elementInfo.selectorPath}`);

  if (scope.selectedText) {
    lines.push(`**Selected text:** "${scope.selectedText}"`);
  }

  lines.push(`**Feedback:** ${scope.comment || '(no comment)'}`);

  return lines.join('\n');
}

/**
 * Generate detailed output for a single scope
 */
function generateDetailedScope(scope: Scope): string {
  const lines: string[] = [];
  const info = scope.elementInfo;

  lines.push(`### ${scope.number}. ${info.humanReadable}`);
  lines.push('');

  // Location info
  lines.push(`**Location:** \`${info.selectorPath}\``);

  if (info.id) {
    lines.push(`**ID:** ${info.id}`);
  }

  if (info.classes.length > 0) {
    lines.push(`**Classes:** ${info.classes.join(', ')}`);
  }

  // Position
  const rect = info.rect;
  lines.push(`**Position:** ${Math.round(rect.left)}x${Math.round(rect.top)}, ${Math.round(rect.width)}×${Math.round(rect.height)}px`);

  if (info.isFixed) {
    lines.push(`**Positioning:** Fixed/Sticky`);
  }

  // Selected text
  if (scope.selectedText) {
    lines.push(`**Selected text:** "${scope.selectedText}"`);
  }

  // Nearby context
  const ctx = info.nearbyContext;
  if (ctx.parent || ctx.containingLandmark) {
    lines.push('');
    lines.push('**Context:**');
    if (ctx.containingLandmark) {
      lines.push(`- Landmark: ${ctx.containingLandmark}`);
    }
    if (ctx.parent) {
      lines.push(`- Parent: ${ctx.parent}`);
    }
    if (ctx.previousSibling) {
      lines.push(`- Previous: ${ctx.previousSibling}`);
    }
    if (ctx.nextSibling) {
      lines.push(`- Next: ${ctx.nextSibling}`);
    }
  }

  lines.push('');
  lines.push(`**Feedback:** ${scope.comment || '(no comment)'}`);

  return lines.join('\n');
}

/**
 * Generate forensic output for a single scope
 */
function generateForensicScope(scope: Scope, _env: EnvironmentInfo): string {
  const lines: string[] = [];
  const info = scope.elementInfo;

  lines.push(`### ${scope.number}. ${info.humanReadable}`);
  lines.push('');

  // Full DOM path
  lines.push('#### DOM Path');
  lines.push('```');
  lines.push(info.fullDomPath);
  lines.push('```');
  lines.push('');

  // CSS Selector
  lines.push(`**Selector:** \`${info.selectorPath}\``);
  lines.push('');

  // Element details
  lines.push('#### Element Details');
  lines.push(`- **Tag:** ${info.tagName}`);

  if (info.id) {
    lines.push(`- **ID:** ${info.id}`);
  }

  if (info.classes.length > 0) {
    lines.push(`- **Classes:** ${info.classes.join(', ')}`);
  }

  // Attributes
  const attrEntries = Object.entries(info.attributes);
  if (attrEntries.length > 0) {
    lines.push('- **Attributes:**');
    for (const [key, value] of attrEntries.slice(0, 10)) {
      lines.push(`  - ${key}: "${value}"`);
    }
  }

  // Content preview
  if (info.innerText) {
    lines.push(`- **Text content:** "${info.innerText}"`);
  }

  lines.push('');

  // Bounding box
  lines.push('#### Position & Dimensions');
  const rect = info.rect;
  lines.push(`- **Bounding box:** (${Math.round(rect.left)}, ${Math.round(rect.top)}) to (${Math.round(rect.right)}, ${Math.round(rect.bottom)})`);
  lines.push(`- **Size:** ${Math.round(rect.width)}×${Math.round(rect.height)}px`);
  lines.push(`- **Fixed positioning:** ${info.isFixed ? 'Yes' : 'No'}`);
  lines.push('');

  // Accessibility
  lines.push('#### Accessibility');
  const a11y = info.accessibility;
  lines.push(`- **Role:** ${a11y.role || 'none'}`);
  lines.push(`- **Interactive:** ${a11y.isInteractive ? 'Yes' : 'No'}`);

  if (a11y.ariaLabel) {
    lines.push(`- **ARIA Label:** "${a11y.ariaLabel}"`);
  }
  if (a11y.ariaDescribedBy) {
    lines.push(`- **Described by:** "${a11y.ariaDescribedBy}"`);
  }
  if (a11y.tabIndex !== null) {
    lines.push(`- **Tab index:** ${a11y.tabIndex}`);
  }
  lines.push('');

  // Computed styles
  if (info.computedStyles) {
    lines.push('#### Computed Styles');
    lines.push('```css');
    lines.push(formatStyles(info.computedStyles as unknown as Record<string, string>));
    lines.push('```');
    lines.push('');
  }

  // Context
  const ctx = info.nearbyContext;
  lines.push('#### Context');
  if (ctx.containingLandmark) {
    lines.push(`- **Landmark:** ${ctx.containingLandmark}`);
  }
  if (ctx.parent) {
    lines.push(`- **Parent:** ${ctx.parent}`);
  }
  if (ctx.previousSibling) {
    lines.push(`- **Previous sibling:** ${ctx.previousSibling}`);
  }
  if (ctx.nextSibling) {
    lines.push(`- **Next sibling:** ${ctx.nextSibling}`);
  }
  lines.push('');

  // Selected text
  if (scope.selectedText) {
    lines.push(`**Selected text:** "${scope.selectedText}"`);
    lines.push('');
  }

  // Multi-select info
  if (scope.isMultiSelect) {
    lines.push('*Created via multi-select*');
    lines.push('');
  }

  // Timestamps
  lines.push('#### Metadata');
  lines.push(`- **Created:** ${new Date(scope.createdAt).toISOString()}`);
  lines.push(`- **Updated:** ${new Date(scope.updatedAt).toISOString()}`);
  lines.push('');

  // Feedback
  lines.push('#### Feedback');
  lines.push(scope.comment || '(no comment)');

  return lines.join('\n');
}

/**
 * Generate header for output
 */
function generateHeader(level: OutputLevel, scopeCount: number): string {
  const lines: string[] = [];
  const path = window.location.pathname;

  lines.push(`## Page Feedback: ${path}`);

  if (level === 'compact') {
    lines.push('');
    return lines.join('\n');
  }

  lines.push(`**Viewport:** ${window.innerWidth}×${window.innerHeight}`);
  lines.push(`**Scopes:** ${scopeCount}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate forensic header with full environment info
 */
function generateForensicHeader(env: EnvironmentInfo, scopeCount: number): string {
  const lines: string[] = [];

  lines.push(`## Page Feedback: ${env.url}`);
  lines.push('');
  lines.push('### Environment');
  lines.push(`- **URL:** ${env.url}`);
  lines.push(`- **Viewport:** ${env.viewport.width}×${env.viewport.height}`);
  lines.push(`- **Device pixel ratio:** ${env.devicePixelRatio}`);
  lines.push(`- **Scroll position:** (${env.scrollPosition.x}, ${env.scrollPosition.y})`);
  lines.push(`- **Timestamp:** ${env.timestamp}`);
  lines.push(`- **User agent:** ${env.userAgent}`);
  lines.push(`- **Total scopes:** ${scopeCount}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate markdown output for all scopes
 */
export function generateOutput(scopes: Scope[], level: OutputLevel): string {
  if (scopes.length === 0) {
    return '## Page Feedback\n\nNo scopes created.';
  }

  const sortedScopes = [...scopes].sort((a, b) => a.number - b.number);
  const env = level === 'forensic' ? getEnvironmentInfo() : null;

  const parts: string[] = [];

  // Header
  if (level === 'forensic' && env) {
    parts.push(generateForensicHeader(env, scopes.length));
  } else {
    parts.push(generateHeader(level, scopes.length));
  }

  // Scope content
  for (const scope of sortedScopes) {
    switch (level) {
      case 'compact':
        parts.push(generateCompactScope(scope));
        break;
      case 'standard':
        parts.push(generateStandardScope(scope));
        break;
      case 'detailed':
        parts.push(generateDetailedScope(scope));
        break;
      case 'forensic':
        parts.push(generateForensicScope(scope, env!));
        break;
    }

    // Add separator between scopes for non-compact levels
    if (level !== 'compact') {
      parts.push('');
      parts.push('---');
      parts.push('');
    }
  }

  // For compact level, join with newlines
  if (level === 'compact') {
    return parts.join('\n');
  }

  return parts.join('\n').trim();
}

/**
 * Copy output to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      console.error('[Annotation] Failed to copy to clipboard:', error);
      return false;
    }
  }
}
