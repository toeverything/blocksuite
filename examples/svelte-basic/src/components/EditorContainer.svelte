<script lang="ts">
  import { onMount } from 'svelte';
  import { getContext } from 'svelte';
  import type { Writable } from 'svelte/store';
  import type { AppState } from '../editor/editor';

  const appState = getContext<Writable<AppState>>('appState');
  let editorContainer: HTMLDivElement;

  onMount(() => {
    appState.subscribe(({ editor }) => {
      editorContainer && editorContainer.appendChild(editor);
    });
  });
</script>

<div bind:this={editorContainer} class="editor-container"></div>
