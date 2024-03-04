<template>
  <div class="sidebar">
    <div class="header">All Docs</div>
    <div class="doc-list">
      <div
        v-for="doc in docs"
        :key="doc.id"
        :class="{ 'doc-item': true, active: editor?.doc === doc }"
        @click="selectDoc(doc as Doc)"
      >
        {{ doc.meta?.title || 'Untitled' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { AppState } from './EditorProvider.vue';
import { Doc } from '@blocksuite/store';

const { editor, workspace } = inject<AppState>('appState')!;
const docs = ref<Doc[]>([...workspace.docs.values()]);

const updateDocs = () => (docs.value = [...workspace.docs.values()]);

workspace.slots.docUpdated.on(updateDocs);
editor.slots.docLinkClicked.on(updateDocs);

const selectDoc = (doc: Doc) => {
  editor.doc = doc;
  updateDocs();
};
</script>
