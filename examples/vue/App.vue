<script setup lang="ts">
import { AgentUIAnnotation, useAgentUIAnnotation } from 'agent-ui-annotation/vue';
import LandingPage from './components/LandingPage.vue';

const { ref: annotationRef, activate, copyOutput } = useAgentUIAnnotation();

const onAnnotationCreate = (annotation: any) => console.log('Created:', annotation);
const onCopy = (content: string) => console.log('Copied:', content);
</script>

<template>
  <h1>Agent UI Annotation - Vue</h1>
  <button @click="activate">Activate</button>
  <button @click="copyOutput()">Copy Output</button>

  <LandingPage />

  <AgentUIAnnotation
    ref="annotationRef"
    theme="auto"
    output-level="standard"
    @annotation-create="onAnnotationCreate"
    @copy="onCopy"
  />
</template>
