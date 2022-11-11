import {
  StoreOptionsHandleUploadRequest,
  Signal,
  Disposable,
  flattenDisposable,
} from '@blocksuite/store';
import { renderSpec } from './render-spec';
import { ChangeEvent } from 'react';

export function playgroundUploaderUI(options: {
  mountContainer: HTMLElement;
}): StoreOptionsHandleUploadRequest {
  const $promptText$ = new Signal<string>();
  const $filesSelected$ = new Signal<FileList | null>();
  const $show$ = new Signal<boolean>();
  const $cancel$ = new Signal<true>();
  const { dom } = renderSpec(document, [
    'div',
    {
      style: [
        'font-family: system-ui, sans-serif; position: absolute; z-index: 3000; inset: 0px',
        'display: flex; align-items: center; justify-content: center',
        'pointer-events: none',
      ].join(';'),
    },
    $show$.map(
      show =>
        show && [
          'form',
          {
            action: '#',
            style: [
              'padding: 2em; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.2)',
              'background: white; max-width: 300px;',
              'pointer-events: all',
            ].join(';'),
            onsubmit(event: SubmitEvent) {
              console.log('submitted', event);
              event.preventDefault();
              return false;
            },
          },
          [
            'label',
            {
              for: 'upload-file-input',
              style:
                'font-size: 2em; font-weight: bold; display: block; margin-bottom: 0.5em',
            },
            $promptText$,
          ],
          [
            'input',
            {
              id: 'upload-file-input',
              type: 'file',
              onchange(this: HTMLInputElement, event: ChangeEvent) {
                console.log('onchange event', event, this.files);
                $filesSelected$.emit(this.files);
              },
            },
          ],
          [
            'button',
            {
              type: 'button',
              onclick() {
                $cancel$.emit(true);
              },
            },
            'Dismiss',
          ],
        ]
    ),
  ]);
  options.mountContainer.appendChild(dom);
  return prompt => {
    return new Promise(res => {
      const disposables: Disposable[] = [];
      $show$.emit(true); // show before assigning prompt text, because Signals are events.
      $promptText$.emit(prompt.promptText);
      disposables.push(
        $cancel$.once(() => {
          $show$.emit(false);
          flattenDisposable(disposables).dispose();
          res(null);
        }),
        $filesSelected$.on(fileList => {
          if (fileList) {
            const item = fileList.item(0);
            console.assert(
              fileList.length === 1 && item,
              'expect one file',
              fileList
            );
            $show$.emit(false);
            // @ts-ignore
            res(item);
          }
        })
      );
    });
  };
}
