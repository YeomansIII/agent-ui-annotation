/**
 * Animation/video freeze functionality
 */

import type { AppState } from '../types';
import type { Store } from '../store';
import type { EventBus } from '../event-bus';
import type { EventMap } from '../types';

const FREEZE_STYLE_ID = 'annotation-freeze-styles';

/** CSS to freeze animations */
const FREEZE_CSS = `
  *:not([data-annotation-toolbar] *):not([data-annotation-marker] *):not([data-annotation-popup] *) {
    animation-play-state: paused !important;
    transition: none !important;
  }
`;

/**
 * Create freeze manager for animations and videos
 */
export function createFreezeManager(
  store: Store<AppState>,
  eventBus: EventBus<EventMap>
) {
  let isFrozen = false;
  let styleElement: HTMLStyleElement | null = null;
  let pausedVideos: WeakSet<HTMLVideoElement> = new WeakSet();

  /**
   * Inject freeze stylesheet
   */
  const injectFreezeStyles = () => {
    if (styleElement) return;

    styleElement = document.createElement('style');
    styleElement.id = FREEZE_STYLE_ID;
    styleElement.textContent = FREEZE_CSS;
    document.head.appendChild(styleElement);
  };

  /**
   * Remove freeze stylesheet
   */
  const removeFreezeStyles = () => {
    if (!styleElement) return;

    styleElement.remove();
    styleElement = null;
  };

  /**
   * Pause all videos on the page
   */
  const pauseVideos = () => {
    const videos = document.querySelectorAll('video');

    for (const video of videos) {
      // Only pause videos that were playing
      if (!video.paused) {
        pausedVideos.add(video);
        video.pause();
      }
    }
  };

  /**
   * Resume videos that were paused by freeze
   */
  const resumeVideos = () => {
    const videos = document.querySelectorAll('video');

    for (const video of videos) {
      if (pausedVideos.has(video)) {
        video.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    }

    pausedVideos = new WeakSet();
  };

  /**
   * Freeze all animations and videos
   */
  const freeze = () => {
    if (isFrozen) return;

    injectFreezeStyles();
    pauseVideos();

    isFrozen = true;
    store.setState({ isFrozen: true });
    eventBus.emit('freeze:toggle', { frozen: true });
  };

  /**
   * Unfreeze animations and videos
   */
  const unfreeze = () => {
    if (!isFrozen) return;

    removeFreezeStyles();
    resumeVideos();

    isFrozen = false;
    store.setState({ isFrozen: false });
    eventBus.emit('freeze:toggle', { frozen: false });
  };

  /**
   * Toggle freeze state
   */
  const toggle = () => {
    if (isFrozen) {
      unfreeze();
    } else {
      freeze();
    }
  };

  /**
   * Clean up on destroy
   */
  const destroy = () => {
    if (isFrozen) {
      unfreeze();
    }
  };

  return {
    freeze,
    unfreeze,
    toggle,
    destroy,
    isFrozen: () => isFrozen,
  };
}

export type FreezeManager = ReturnType<typeof createFreezeManager>;
