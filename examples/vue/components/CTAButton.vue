<template>
  <button class="cta-button">{{ label }}</button>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<style scoped>
.cta-button {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #5b7cfa;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
</style>
