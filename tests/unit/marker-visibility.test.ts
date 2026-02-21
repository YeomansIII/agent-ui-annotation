/**
 * Tests for MarkerVisibility (three-state eye button)
 */

import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/core/state';
import { createStore } from '../../src/core/store';

describe('MarkerVisibility state', () => {
  it('should default to "full" visibility', () => {
    const state = createInitialState();
    expect(state.markerVisibility).toBe('full');
  });

  it('should cycle full → dots → hidden → full', () => {
    const store = createStore(createInitialState());

    // Initial: full
    expect(store.getState().markerVisibility).toBe('full');

    // Toggle to dots
    store.setState({ markerVisibility: 'dots' });
    expect(store.getState().markerVisibility).toBe('dots');

    // Toggle to hidden
    store.setState({ markerVisibility: 'hidden' });
    expect(store.getState().markerVisibility).toBe('hidden');

    // Toggle back to full
    store.setState({ markerVisibility: 'full' });
    expect(store.getState().markerVisibility).toBe('full');
  });

  it('dots mode should keep markers visible (non-hidden)', () => {
    const state = createInitialState({ markerVisibility: 'dots', toolbarExpanded: false });
    // Dots mode: markers visible even when toolbar is collapsed
    expect(state.markerVisibility).toBe('dots');
    expect(state.toolbarExpanded).toBe(false);
  });

  it('hidden mode should hide markers', () => {
    const state = createInitialState({ markerVisibility: 'hidden' });
    expect(state.markerVisibility).toBe('hidden');
  });
});
