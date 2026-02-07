/**
 * Framework component path detection
 */

export interface ComponentPathInfo {
  framework: string | null;
  path: string | null;
}

function normalizePath(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.replace(/\\/g, '/');
}

function getBaseName(path: string): string {
  const normalized = normalizePath(path) ?? path;
  const parts = normalized.split('/');
  return parts[parts.length - 1] || normalized;
}

function formatFileLabel(filePath: string, lineNumber?: number | null): string {
  const base = getBaseName(filePath);
  return lineNumber ? `${base}:${lineNumber}` : base;
}

function formatComponentLabel(name: string | null, fileLabel: string | null): string | null {
  if (name && fileLabel) return `${name} (${fileLabel})`;
  if (name) return name;
  if (fileLabel) return fileLabel;
  return null;
}

function uniquePush(segments: string[], label: string | null) {
  if (!label) return;
  if (segments[segments.length - 1] === label) return;
  if (segments.includes(label)) return;
  segments.push(label);
}

function getReactInfo(element: Element): ComponentPathInfo | null {
  const keys = Object.keys(element) as string[];
  const fiberKey = keys.find((key) =>
    key.startsWith('__reactFiber$') ||
    key.startsWith('__reactInternalInstance$')
  );
  if (!fiberKey) return null;

  const fiber = (element as any)[fiberKey];
  if (!fiber) return null;

  const segments: string[] = [];

  let current = fiber;
  while (current) {
    const type = current.elementType || current.type;
    const isHost = typeof type === 'string';
    const name = !isHost
      ? (type?.displayName || type?.name || current.type?.displayName || current.type?.name)
      : null;

    const source = current._debugSource;
    const fileName = normalizePath(source?.fileName);
    const lineNumber = source?.lineNumber;

    const fileLabel = fileName ? formatFileLabel(fileName, lineNumber) : null;
    const label = name ? formatComponentLabel(name, fileLabel) : null;

    uniquePush(segments, label);
    current = current._debugOwner;
  }

  if (segments.length === 0) return null;

  const path = segments.reverse().join(' > ');
  return { framework: 'react', path };
}

function getVueInfo(element: Element): ComponentPathInfo | null {
  const instance = (element as any).__vueParentComponent || (element as any).__vue__;
  if (!instance) return null;

  const segments: string[] = [];
  let current = instance;

  while (current) {
    const type = current.type || current;
    const name = type?.name || type?.__name || null;
    const file = normalizePath(type?.__file);

    const fileLabel = file ? formatFileLabel(file, null) : null;
    const label = formatComponentLabel(name ?? null, fileLabel);

    uniquePush(segments, label);
    current = current.parent;
  }

  if (segments.length === 0) return null;

  const path = segments.reverse().join(' > ');
  return { framework: 'vue', path };
}

function getAngularInfo(element: Element): ComponentPathInfo | null {
  const ng = (window as any).ng;
  if (!ng || (typeof ng.getOwningComponent !== 'function' && typeof ng.getComponent !== 'function')) return null;

  const segments: string[] = [];
  let current: Element | null = element;
  while (current) {
    const component = typeof ng.getComponent === 'function' ? ng.getComponent(current) : null;
    const owning = typeof ng.getOwningComponent === 'function' ? ng.getOwningComponent(current) : null;

    if (component) {
      const ctor = component.constructor;
      const name = ctor?.name || component?.name || null;
      uniquePush(segments, name);
    }

    if (owning && owning !== component) {
      const ctor = owning.constructor;
      const name = ctor?.name || owning?.name || null;
      uniquePush(segments, name);
    }
    current = current.parentElement;
  }

  if (segments.length === 0) return null;

  const path = segments.reverse().join(' > ');
  return { framework: 'angular', path };
}

function getSvelteInfo(element: Element): ComponentPathInfo | null {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current) {
    const meta = (current as any).__svelte_meta;
    if (meta?.loc?.file) {
      const file = normalizePath(meta.loc.file);
      const line = meta.loc.line;
      if (file) {
        uniquePush(segments, formatFileLabel(file, line));
      }
    }

    const component = (current as any).__svelte;
    const source = component?.$$?.source || component?.$$?.context?.source;
    if (source?.file) {
      const file = normalizePath(source.file);
      const line = source.line;
      if (file) {
        uniquePush(segments, formatFileLabel(file, line));
      }
    }

    current = current.parentElement;
  }

  if (segments.length === 0) return null;

  const path = segments.reverse().join(' > ');
  return { framework: 'svelte', path };
}

export function getComponentPathInfo(element: Element): ComponentPathInfo {
  return (
    getReactInfo(element) ||
    getVueInfo(element) ||
    getSvelteInfo(element) ||
    getAngularInfo(element) ||
    { framework: null, path: null }
  );
}
