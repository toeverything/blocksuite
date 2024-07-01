<script lang="ts">
  import type { Doc } from '@blocksuite/store';
  import { getContext } from 'svelte';
  import { onMount } from 'svelte';
  import type { AppState } from '../editor/editor';
  import type { Writable } from 'svelte/store';

  const appState = getContext<Writable<AppState>>('appState');

  let docs: Doc[] = [];

  const selectDoc = (doc: Doc) => {
    appState.update(state => {
      state.editor.doc = doc;
      return state;
    });
  };

  onMount(() => {
    appState.subscribe(({ collection, editor }) => {
      docs = [...collection.docs.values()].map(blocks => blocks.getDoc());
      collection.slots.docUpdated.on(() => {
        docs = [...collection.docs.values()].map(blocks => blocks.getDoc());
      });
      editor.slots.docLinkClicked.on(() => {
        docs = [...collection.docs.values()].map(blocks => blocks.getDoc());
      });
    });
  });
</script>

<div class="sidebar">
  <div class="header">All Docs</div>
  <div class="doc-list">
    {#each docs as doc}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class:doc-item={true}
        class:active={$appState.editor.doc === doc}
        on:click={() => selectDoc(doc)}
      >
        {doc.meta?.title || 'Untitled'}
      </div>
    {/each}
  </div>
</div>
