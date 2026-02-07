<script lang="ts">
  import { AgentUIAnnotation } from 'agent-ui-annotation/svelte';
  import type { Annotation } from 'agent-ui-annotation/svelte';
  import LandingPage from './components/LandingPage.svelte';

  let annotation: AgentUIAnnotation;

  const onAnnotationCreate = (a: Annotation) => console.log('Created:', a);
  const onCopy = (content: string) => console.log('Copied:', content);
</script>

<h1>Agent UI Annotation - Svelte</h1>
<button onclick={() => annotation.activate()}>Activate</button>
<button onclick={() => annotation.copyOutput()}>Copy Output</button>

<LandingPage />

<AgentUIAnnotation
  bind:this={annotation}
  theme="auto"
  outputLevel="standard"
  {onAnnotationCreate}
  {onCopy}
/>
