<script lang="ts">
  import Sidebar from './components/Sidebar.svelte';
  import TopBar from './components/TopBar.svelte';
  import EditorContainer from './components/EditorContainer.svelte';
  import { initEditor, type AppState } from './editor/editor';
  import { writable } from 'svelte/store';
  import { setContext } from 'svelte';

  const appState = writable<AppState>(initEditor());
  setContext('appState', appState);
</script>

<div class="app">
  <Sidebar />
  <div class="main-content">
    <TopBar />
    <EditorContainer />
  </div>
</div>
