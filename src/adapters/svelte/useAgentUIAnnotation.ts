/**
 * Svelte 5 hook for agent-ui-annotation
 */

import type { OutputLevel } from '../../core/types';
import type { AgentUIAnnotationExpose } from './types';

/**
 * Hook for using agent-ui-annotation imperatively in Svelte 5
 *
 * @example
 * ```svelte
 * <script>
 * import { AgentUIAnnotation, useAgentUIAnnotation } from 'agent-ui-annotation/svelte'
 *
 * const annotation = useAgentUIAnnotation()
 * </script>
 *
 * <AgentUIAnnotation bind:this={annotation.ref} />
 * <button onclick={() => annotation.activate()}>Start</button>
 * <button onclick={() => annotation.copyOutput()}>Copy</button>
 * ```
 */
export function useAgentUIAnnotation() {
  let component: AgentUIAnnotationExpose | null = null;

  const activate = () => {
    component?.activate();
  };

  const deactivate = () => {
    component?.deactivate();
  };

  const toggle = () => {
    component?.toggle();
  };

  const copyOutput = async (level?: OutputLevel): Promise<boolean> => {
    return component?.copyOutput(level) ?? Promise.resolve(false);
  };

  const getOutput = (level?: OutputLevel): string => {
    return component?.getOutput(level) ?? '';
  };

  const clearAll = () => {
    component?.clearAll();
  };

  return {
    get ref() {
      return component;
    },
    set ref(value: AgentUIAnnotationExpose | null) {
      component = value;
    },
    activate,
    deactivate,
    toggle,
    copyOutput,
    getOutput,
    clearAll,
  };
}
