import { onMount } from 'solid-js';
import { useEditor } from './EditorProvider';

export function EditorContainer() {
  let editorContainerRef: HTMLDivElement | undefined;

  const { editor } = useEditor()!;

  onMount(() => {
    if (editorContainerRef) {
      editorContainerRef.appendChild(editor);
    }
  });

  return <div class="editor-container" ref={editorContainerRef}></div>;
}
