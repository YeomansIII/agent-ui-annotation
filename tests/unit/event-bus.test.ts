/**
 * Event bus tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../../src/core/event-bus';

interface TestEvents {
  'test:event': { value: number };
  'another:event': { message: string };
}

describe('createEventBus', () => {
  it('should emit and receive events', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();

    bus.on('test:event', handler);
    bus.emit('test:event', { value: 42 });

    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('should support multiple handlers for same event', () => {
    const bus = createEventBus<TestEvents>();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on('test:event', handler1);
    bus.on('test:event', handler2);
    bus.emit('test:event', { value: 1 });

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should unsubscribe handlers', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();

    const unsubscribe = bus.on('test:event', handler);
    unsubscribe();
    bus.emit('test:event', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support once for single emission', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();

    bus.once('test:event', handler);
    bus.emit('test:event', { value: 1 });
    bus.emit('test:event', { value: 2 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ value: 1 });
  });

  it('should remove all handlers for an event', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();

    bus.on('test:event', handler);
    bus.off('test:event');
    bus.emit('test:event', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should remove all handlers when off called without event', () => {
    const bus = createEventBus<TestEvents>();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on('test:event', handler1);
    bus.on('another:event', handler2);
    bus.off();
    bus.emit('test:event', { value: 1 });
    bus.emit('another:event', { message: 'test' });

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should stop emitting after destroy', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();

    bus.on('test:event', handler);
    bus.destroy();
    bus.emit('test:event', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle errors in handlers gracefully', () => {
    const bus = createEventBus<TestEvents>();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const errorHandler = vi.fn(() => {
      throw new Error('Test error');
    });
    const normalHandler = vi.fn();

    bus.on('test:event', errorHandler);
    bus.on('test:event', normalHandler);
    bus.emit('test:event', { value: 1 });

    expect(errorHandler).toHaveBeenCalled();
    expect(normalHandler).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
