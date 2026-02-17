/**
 * Route helpers for SPA-aware annotations
 */

import type { Annotation } from '../types';

export function normalizeRoute(route: string): string {
  const hashIndex = route.indexOf('#');
  return hashIndex >= 0 ? route.slice(0, hashIndex) : route;
}

function normalizeRouteToHref(route: string): string {
  const normalized = normalizeRoute(route);
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  if (typeof window === 'undefined') return normalized;
  const prefix = normalized.startsWith('/') ? '' : '/';
  return `${window.location.origin}${prefix}${normalized}`;
}

export function resolveRoute(route: string): string {
  return normalizeRouteToHref(route);
}

export function getCurrentRoute(): string {
  if (typeof window === 'undefined') return '/';
  return normalizeRoute(window.location.href);
}

export function getAnnotationRoute(annotation: Annotation): string | null {
  const route = annotation.context?.route;
  if (typeof route === 'string' && route.trim().length > 0) {
    return normalizeRouteToHref(route.trim());
  }
  return null;
}

export function isAnnotationVisibleOnRoute(annotation: Annotation, currentRoute: string): boolean {
  // If the annotation's element is currently connected to the DOM, always show it.
  // This handles elements that exist on multiple routes (e.g., navigation, headers).
  if (annotation.element && annotation.element.isConnected) {
    return true;
  }

  // For annotations without a live element, fall back to route matching
  const annotationRoute = getAnnotationRoute(annotation);
  if (!annotationRoute) return true;
  return annotationRoute === currentRoute;
}
