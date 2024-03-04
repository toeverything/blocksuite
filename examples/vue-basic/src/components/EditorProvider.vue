<template>
  <div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue';
import { initEditor } from '../editor/editor';
import { Workspace } from '@blocksuite/store';
import { AffineEditorContainer } from '@blocksuite/presets';

export interface AppState {
  editor: AffineEditorContainer;
  workspace: Workspace;
}

provide('appState', initEditor());
</script>
