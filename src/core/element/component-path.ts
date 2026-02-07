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

function getReactInfo(element: Element): ComponentPathInfo | null {
  const keys = Object.keys(element) as string[];
  const fiberKey = keys.find((key) =>
    key.startsWith('__reactFiber$') ||
    key.startsWith('__reactInternalInstance$')
  );
  if (!fiberKey) return null;

  const fiber = (element as any)[fiberKey];
  if (!fiber) return null;

  const names: string[] = [];
  let owner = fiber._debugOwner;
  while (owner) {
    const type = owner.type;
    const name = typeof type === 'function'
      ? (type.displayName || type.name)
      : typeof type === 'string'
        ? type
        : null;
    if (name && name !== 'Anonymous') {
      names.unshift(name);
    }
    owner = owner._debugOwner;
  }

  const source = fiber._debugSource || fiber._debugOwner?._debugSource;
  const fileName = normalizePath(source?.fileName);
  const lineNumber = source?.lineNumber;
  const filePath = fileName ? (lineNumber ? `${fileName}:${lineNumber}` : fileName) : null;

  if (!filePath && names.length === 0) return null;

  const stack = names.length > 0 ? names.join(' > ') : null;
  const path = filePath && stack ? `${stack} (${filePath})` : (filePath || stack);

  return { framework: 'react', path };
}

function getVueInfo(element: Element): ComponentPathInfo | null {
  const instance = (element as any).__vueParentComponent || (element as any).__vue__;
  if (!instance) return null;

  const names: string[] = [];
  let current = instance;
  let filePath: string | null = null;

  while (current) {
    const type = current.type || current;
    const name = type?.name || type?.__name;
    if (name) names.unshift(name);
    if (!filePath && type?.__file) {
      filePath = normalizePath(type.__file);
    }
    current = current.parent;
  }

  if (!filePath && names.length === 0) return null;

  const stack = names.length > 0 ? names.join(' > ') : null;
  const path = filePath && stack ? `${stack} (${filePath})` : (filePath || stack);

  return { framework: 'vue', path };
}

function getAngularInfo(element: Element): ComponentPathInfo | null {
  const ng = (window as any).ng;
  if (!ng || typeof ng.getOwningComponent !== 'function') return null;

  const component = ng.getOwningComponent(element);
  if (!component) return null;

  const ctor = component.constructor;
  const name = ctor?.name || component?.name || null;

  if (!name) return null;

  return { framework: 'angular', path: name };
}

function getSvelteInfo(element: Element): ComponentPathInfo | null {
  let current: Element | null = element;

  while (current) {
    const meta = (current as any).__svelte_meta;
    if (meta?.loc?.file) {
      const file = normalizePath(meta.loc.file);
      const line = meta.loc.line;
      const path = file ? (line ? `${file}:${line}` : file) : null;
      if (path) {
        return { framework: 'svelte', path };
      }
    }

    const component = (current as any).__svelte;
    const source = component?.$$?.source || component?.$$?.context?.source;
    if (source?.file) {
      const file = normalizePath(source.file);
      const line = source.line;
      const path = file ? (line ? `${file}:${line}` : file) : null;
      if (path) {
        return { framework: 'svelte', path };
      }
    }

    current = current.parentElement;
  }

  return null;
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
