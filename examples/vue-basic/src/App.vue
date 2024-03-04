<template>
  <EditorProvider>
    <div class="app">
      <Sidebar />
      <div class="main-content">
        <TopBar />
        <EditorContainer />
      </div>
    </div>
  </EditorProvider>
</template>

<script setup>
import EditorProvider from './components/EditorProvider.vue';
import Sidebar from './components/Sidebar.vue';
import TopBar from './components/TopBar.vue';
import EditorContainer from './components/EditorContainer.vue';
import './index.css';
</script>
