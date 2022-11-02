import {
  EditorContainer,
  parseEditorOptions,
  type EditorOptions,
} from '@blocksuite/editor';
import { createComponent } from '@lit-labs/react';
import * as React from 'react';

export const EditorComponent = createComponent(
  React,
  'editor-container',
  EditorContainer,
  {
    // TODO update events
  }
);

export const Editor = (options: EditorOptions = {}) => {
  const editorOptions = parseEditorOptions(options);
  return <EditorComponent {...editorOptions} />;
};
