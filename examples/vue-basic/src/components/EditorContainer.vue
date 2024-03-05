<template>
  <div class="editor-container" ref="editorContainerRef"></div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import { AppState } from './EditorProvider.vue';

const { editor } = inject<AppState>('appState')!;
const editorContainerRef = ref<HTMLDivElement>();

onMounted(() => {
  editorContainerRef.value && editorContainerRef.value.appendChild(editor);
});
</script>
