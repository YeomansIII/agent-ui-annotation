/**
 * Markdown output generation for annotations
 */

import type { Annotation, OutputLevel, EnvironmentInfo } from '../types';
import { formatStyles } from '../element/styles';
import { tOutput } from '../i18n';

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
 * Generate compact output for a single annotation
 * Format: `1. **button "Save"**: Change color to blue`
 */
function generateCompactAnnotation(annotation: Annotation): string {
  const element = annotation.elementInfo.humanReadable;
  const comment = annotation.comment || tOutput('marker.noComment');
  return `${annotation.number}. **${element}**: ${comment}`;
}

/**
 * Generate standard output for a single annotation
 */
function generateStandardAnnotation(annotation: Annotation): string {
  const lines: string[] = [];

  lines.push(`### ${annotation.number}. ${annotation.elementInfo.humanReadable}`);
  lines.push(`**${tOutput('output.location')}:** ${annotation.elementInfo.selectorPath}`);

  if (annotation.selectedText) {
    lines.push(`**${tOutput('output.selectedText')}:** "${annotation.selectedText}"`);
  }

  lines.push(`**${tOutput('output.feedback')}:** ${annotation.comment || tOutput('marker.noComment')}`);

  return lines.join('\n');
}

/**
 * Generate detailed output for a single annotation
 */
function generateDetailedAnnotation(annotation: Annotation): string {
  const lines: string[] = [];
  const info = annotation.elementInfo;

  lines.push(`### ${annotation.number}. ${info.humanReadable}`);
  lines.push('');

  // Location info
  lines.push(`**${tOutput('output.location')}:** \`${info.selectorPath}\``);

  if (info.id) {
    lines.push(`**${tOutput('output.id')}:** ${info.id}`);
  }

  if (info.classes.length > 0) {
    lines.push(`**${tOutput('output.classes')}:** ${info.classes.join(', ')}`);
  }

  // Position
  const rect = info.rect;
  lines.push(`**Position:** ${Math.round(rect.left)}x${Math.round(rect.top)}, ${Math.round(rect.width)}×${Math.round(rect.height)}px`);

  if (info.isFixed) {
    lines.push(`**${tOutput('output.positioning')}:** ${tOutput('output.fixedSticky')}`);
  }

  // Selected text
  if (annotation.selectedText) {
    lines.push(`**${tOutput('output.selectedText')}:** "${annotation.selectedText}"`);
  }

  // Nearby context
  const ctx = info.nearbyContext;
  if (ctx.parent || ctx.containingLandmark) {
    lines.push('');
    lines.push(`**${tOutput('output.context')}:**`);
    if (ctx.containingLandmark) {
      lines.push(`- ${tOutput('output.landmark')}: ${ctx.containingLandmark}`);
    }
    if (ctx.parent) {
      lines.push(`- ${tOutput('output.parent')}: ${ctx.parent}`);
    }
    if (ctx.previousSibling) {
      lines.push(`- Previous: ${ctx.previousSibling}`);
    }
    if (ctx.nextSibling) {
      lines.push(`- Next: ${ctx.nextSibling}`);
    }
  }

  lines.push('');
  lines.push(`**${tOutput('output.feedback')}:** ${annotation.comment || tOutput('marker.noComment')}`);

  return lines.join('\n');
}

/**
 * Generate forensic output for a single annotation
 */
function generateForensicAnnotation(annotation: Annotation, _env: EnvironmentInfo): string {
  const lines: string[] = [];
  const info = annotation.elementInfo;

  lines.push(`### ${annotation.number}. ${info.humanReadable}`);
  lines.push('');

  // Full DOM path
  lines.push(`#### ${tOutput('output.domPath')}`);
  lines.push('```');
  lines.push(info.fullDomPath);
  lines.push('```');
  lines.push('');

  // CSS Selector
  lines.push(`**${tOutput('output.selector')}:** \`${info.selectorPath}\``);
  lines.push('');

  // Element details
  lines.push(`#### ${tOutput('output.elementDetails')}`);
  lines.push(`- **${tOutput('output.tag')}:** ${info.tagName}`);

  if (info.id) {
    lines.push(`- **${tOutput('output.id')}:** ${info.id}`);
  }

  if (info.classes.length > 0) {
    lines.push(`- **${tOutput('output.classes')}:** ${info.classes.join(', ')}`);
  }

  // Attributes
  const attrEntries = Object.entries(info.attributes);
  if (attrEntries.length > 0) {
    lines.push(`- **${tOutput('output.attributes')}:**`);
    for (const [key, value] of attrEntries.slice(0, 10)) {
      lines.push(`  - ${key}: "${value}"`);
    }
  }

  // Content preview
  if (info.innerText) {
    lines.push(`- **${tOutput('output.textContent')}:** "${info.innerText}"`);
  }

  lines.push('');

  // Bounding box
  lines.push(`#### ${tOutput('output.positionDimensions')}`);
  const rect = info.rect;
  lines.push(`- **${tOutput('output.boundingBox')}:** (${Math.round(rect.left)}, ${Math.round(rect.top)}) to (${Math.round(rect.right)}, ${Math.round(rect.bottom)})`);
  lines.push(`- **${tOutput('output.size')}:** ${Math.round(rect.width)}×${Math.round(rect.height)}px`);
  lines.push(`- **${tOutput('output.fixedPositioning')}:** ${info.isFixed ? tOutput('output.yes') : tOutput('output.no')}`);
  lines.push('');

  // Accessibility
  lines.push(`#### ${tOutput('output.accessibility')}`);
  const a11y = info.accessibility;
  lines.push(`- **${tOutput('output.role')}:** ${a11y.role || tOutput('output.none')}`);
  lines.push(`- **${tOutput('output.interactive')}:** ${a11y.isInteractive ? tOutput('output.yes') : tOutput('output.no')}`);

  if (a11y.ariaLabel) {
    lines.push(`- **${tOutput('output.ariaLabel')}:** "${a11y.ariaLabel}"`);
  }
  if (a11y.ariaDescribedBy) {
    lines.push(`- **${tOutput('output.describedBy')}:** "${a11y.ariaDescribedBy}"`);
  }
  if (a11y.tabIndex !== null) {
    lines.push(`- **${tOutput('output.tabIndex')}:** ${a11y.tabIndex}`);
  }
  lines.push('');

  // Computed styles
  if (info.computedStyles) {
    lines.push(`#### ${tOutput('output.computedStyles')}`);
    lines.push('```css');
    lines.push(formatStyles(info.computedStyles as unknown as Record<string, string>));
    lines.push('```');
    lines.push('');
  }

  // Context
  const ctx = info.nearbyContext;
  lines.push(`#### ${tOutput('output.context')}`);
  if (ctx.containingLandmark) {
    lines.push(`- **${tOutput('output.landmark')}:** ${ctx.containingLandmark}`);
  }
  if (ctx.parent) {
    lines.push(`- **${tOutput('output.parent')}:** ${ctx.parent}`);
  }
  if (ctx.previousSibling) {
    lines.push(`- **${tOutput('output.previousSibling')}:** ${ctx.previousSibling}`);
  }
  if (ctx.nextSibling) {
    lines.push(`- **${tOutput('output.nextSibling')}:** ${ctx.nextSibling}`);
  }
  lines.push('');

  // Selected text
  if (annotation.selectedText) {
    lines.push(`**${tOutput('output.selectedText')}:** "${annotation.selectedText}"`);
    lines.push('');
  }

  // Multi-select info
  if (annotation.isMultiSelect) {
    lines.push(`*${tOutput('output.multiSelectNote')}*`);
    lines.push('');
  }

  // Timestamps
  lines.push(`#### ${tOutput('output.metadata')}`);
  lines.push(`- **${tOutput('output.created')}:** ${new Date(annotation.createdAt).toISOString()}`);
  lines.push(`- **${tOutput('output.updated')}:** ${new Date(annotation.updatedAt).toISOString()}`);
  lines.push('');

  // Feedback
  lines.push(`#### ${tOutput('output.feedback')}`);
  lines.push(annotation.comment || tOutput('marker.noComment'));

  return lines.join('\n');
}

/**
 * Generate header for output
 */
function generateHeader(level: OutputLevel, annotationCount: number): string {
  const lines: string[] = [];
  const path = window.location.pathname;

  lines.push(`## ${tOutput('output.pageFeedback')}: ${path}`);

  if (level === 'compact') {
    lines.push('');
    return lines.join('\n');
  }

  lines.push(`**${tOutput('output.viewport')}:** ${window.innerWidth}×${window.innerHeight}`);
  lines.push(`**${tOutput('output.annotations')}:** ${annotationCount}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate forensic header with full environment info
 */
function generateForensicHeader(env: EnvironmentInfo, annotationCount: number): string {
  const lines: string[] = [];

  lines.push(`## ${tOutput('output.pageFeedback')}: ${env.url}`);
  lines.push('');
  lines.push(`### ${tOutput('output.environment')}`);
  lines.push(`- **${tOutput('output.url')}:** ${env.url}`);
  lines.push(`- **${tOutput('output.viewport')}:** ${env.viewport.width}×${env.viewport.height}`);
  lines.push(`- **${tOutput('output.devicePixelRatio')}:** ${env.devicePixelRatio}`);
  lines.push(`- **${tOutput('output.scrollPosition')}:** (${env.scrollPosition.x}, ${env.scrollPosition.y})`);
  lines.push(`- **${tOutput('output.timestamp')}:** ${env.timestamp}`);
  lines.push(`- **${tOutput('output.userAgent')}:** ${env.userAgent}`);
  lines.push(`- **${tOutput('output.totalAnnotations')}:** ${annotationCount}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate markdown output for all annotations
 */
export function generateOutput(annotations: Annotation[], level: OutputLevel): string {
  if (annotations.length === 0) {
    return `## ${tOutput('output.pageFeedback')}\n\n${tOutput('output.noAnnotations')}`;
  }

  const sortedAnnotations = [...annotations].sort((a, b) => a.number - b.number);
  const env = level === 'forensic' ? getEnvironmentInfo() : null;

  const parts: string[] = [];

  // Header
  if (level === 'forensic' && env) {
    parts.push(generateForensicHeader(env, annotations.length));
  } else {
    parts.push(generateHeader(level, annotations.length));
  }

  // Annotation content
  for (const annotation of sortedAnnotations) {
    switch (level) {
      case 'compact':
        parts.push(generateCompactAnnotation(annotation));
        break;
      case 'standard':
        parts.push(generateStandardAnnotation(annotation));
        break;
      case 'detailed':
        parts.push(generateDetailedAnnotation(annotation));
        break;
      case 'forensic':
        parts.push(generateForensicAnnotation(annotation, env!));
        break;
    }

    // Add separator between annotations for non-compact levels
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
