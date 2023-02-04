export const checkEditorElementActive = () =>
  document.activeElement?.closest('editor-container') != null;
