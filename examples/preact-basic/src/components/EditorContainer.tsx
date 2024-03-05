import { useEffect, useRef } from 'preact/hooks';
import { useEditor } from '../editor/context';

const EditorContainer = () => {
  const { editor } = useEditor()!;

  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorContainerRef.current && editor) {
      editorContainerRef.current.innerHTML = '';
      editorContainerRef.current.appendChild(editor);
    }
  }, [editor]);

  return <div className="editor-container" ref={editorContainerRef}></div>;
};

export default EditorContainer;
