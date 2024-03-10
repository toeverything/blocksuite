<template>
  <main >
<!--    this is editor-->
    <div ref="editor"></div>
  </main>
</template>

<script setup lang="ts">
import '@blocksuite/presets/themes/affine.css';
import { createEmptyDoc, PageEditor } from '@blocksuite/presets';
import { Text } from '@blocksuite/store';
import {onMounted, ref} from "vue";
const editor = ref(null)
onMounted(()=>{
  const doc = createEmptyDoc().init();
  const editor = new PageEditor();
  editor.doc = doc;
  document.body.appendChild(editor);
  // Update block node with some initial text content
  const paragraphs = doc.getBlockByFlavour('affine:paragraph');
  const paragraph = paragraphs[0];
  doc.updateBlock(paragraph, { text: new Text('Hello World!') });
  console.log("this is doc",doc)
})

</script>

