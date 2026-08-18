/**
 * Tests for restoring a custom toolbar position into core state
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createAnnotationCore } from '../../src/core/controller';
import { saveToolbarPosition } from '../../src/core/annotations/persistence';
import { DEFAULT_TOOLBAR_POSITION } from '../../src/core/state';

describe('toolbar position state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('uses the default corner position when nothing is stored', () => {
    const core = createAnnotationCore({ loadPersisted: true });
    const state = core.store.getState();

    expect(state.hasCustomToolbarPosition).toBe(false);
    expect(state.toolbarPosition).toEqual(DEFAULT_TOOLBAR_POSITION);

    core.destroy();
  });

  it('restores a persisted custom toolbar position', () => {
    saveToolbarPosition({ x: 240, y: 160 });

    const core = createAnnotationCore({ loadPersisted: true });
    const state = core.store.getState();

    expect(state.hasCustomToolbarPosition).toBe(true);
    expect(state.toolbarPosition).toEqual({ x: 240, y: 160 });

    core.destroy();
  });

  it('ignores a stored position when persistence is disabled', () => {
    saveToolbarPosition({ x: 240, y: 160 });

    const core = createAnnotationCore({ loadPersisted: false });
    const state = core.store.getState();

    expect(state.hasCustomToolbarPosition).toBe(false);
    expect(state.toolbarPosition).toEqual(DEFAULT_TOOLBAR_POSITION);

    core.destroy();
  });
});
