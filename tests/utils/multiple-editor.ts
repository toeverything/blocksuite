import process from 'node:process';

const editorIndex = (
  {
    0: 0,
    1: 1,
    '': undefined,
  } satisfies Record<string, number | undefined>
)[process.env.MULTIPLE_EDITOR ?? ''];
export const scope =
  editorIndex == null
    ? undefined
    : editorIndex === 0
    ? 'FIRST | '
    : 'SECOND | ';
export const multiEditor = scope != null;

export const currentEditorIndex = editorIndex ?? 0;
