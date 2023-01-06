import '@blocksuite/blocks';
import { Page, Utils, Workspace } from '@blocksuite/store';
import { BlockSchema } from '@blocksuite/blocks/models';
import std from '@blocksuite/blocks/std';
import { EditorContainer } from '@blocksuite/editor';
import { defaultMode, getOptions, initParam, isBase64, isE2E } from './utils';
import { DebugMenu } from './components/debug-menu';
import { useEffect, useRef } from 'react';

const options = getOptions();

const workspace = new Workspace(options).register(BlockSchema);
// @ts-ignore
[window.workspace, window.blockSchema] = [workspace, BlockSchema];
// @ts-ignore
[window.Y, window.std] = [Workspace.Y, std];

const initButton = document.getElementById('init-btn') as HTMLButtonElement;

// Subscribe for page update and create editor after page loaded.
if (!isE2E) {
  const initFunctions = (await import('./data/index.js')) as Record<
    string,
    (workspace: Workspace) => void
  >;
  initButton.addEventListener('click', () => initFunctions.basic(workspace));
}

export const App = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const onceRef = useRef<boolean>(false);
  useEffect(() => {
    import('./data/index.js').then(initFunctions => {
      if (onceRef.current) {
        return;
      }
      onceRef.current = true;
      if (initParam !== null) {
        if (initFunctions[initParam as keyof typeof initFunctions]) {
          initFunctions[initParam as keyof typeof initFunctions]?.(workspace);
        } else {
          if (initParam !== '' && isBase64.test(initParam)) {
            Utils.applyYjsUpdateV2(workspace, initParam);
          } else {
            // fallback
            initFunctions.basic(workspace);
          }
        }
      }
    });
  }, []);
  useEffect(() => {
    return workspace.signals.pageAdded.once(pageId => {
      if (!rootRef.current) {
        console.error('rootRef is undefined');
        return;
      }
      const page = workspace.getPage(pageId) as Page;

      const editor = new EditorContainer();
      editor.page = page;
      rootRef.current.appendChild(editor);

      const debugMenu = new DebugMenu();
      debugMenu.workspace = workspace;
      debugMenu.editor = editor;
      debugMenu.mode = defaultMode;
      rootRef.current.appendChild(debugMenu);
      initButton.disabled = true;

      // @ts-ignore
      [window.editor, window.page] = [editor, page];
    });
  }, []);
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
      }}
      ref={rootRef}
    ></div>
  );
};
