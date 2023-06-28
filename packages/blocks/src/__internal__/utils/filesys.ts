import type { BlobManager } from '@blocksuite/store';

import type { BookmarkBlockModel } from '../../bookmark-block/index.js';

// Polyfill for `showOpenFilePicker` API
// See https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/wicg-file-system-access/index.d.ts
// See also https://caniuse.com/?search=showOpenFilePicker
interface OpenFilePickerOptions {
  types?:
    | {
        description?: string | undefined;
        accept: Record<string, string | string[]>;
      }[]
    | undefined;
  excludeAcceptAllOption?: boolean | undefined;
  multiple?: boolean | undefined;
}
declare global {
  interface Window {
    // Window API: showOpenFilePicker
    showOpenFilePicker?: (
      options?: OpenFilePickerOptions
    ) => Promise<FileSystemFileHandle[]>;
  }
}

// See [Common MIME types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)
const FileTypes: NonNullable<OpenFilePickerOptions['types']> = [
  {
    description: 'Images',
    accept: {
      'image/*': [
        '.avif',
        '.gif',
        // '.ico',
        '.jpeg',
        '.jpg',
        '.png',
        '.tif',
        '.tiff',
        // '.svg',
        '.webp',
      ],
    },
  },
  {
    description: 'Videos',
    accept: {
      'video/*': [
        '.avi',
        '.mp4',
        '.mpeg',
        '.ogg',
        // '.ts',
        '.webm',
        '.3gp',
        '.3g2',
      ],
    },
  },
  {
    description: 'Audios',
    accept: {
      'audio/*': [
        '.aac',
        '.mid',
        '.midi',
        '.mp3',
        '.oga',
        '.opus',
        '.wav',
        '.weba',
        '.3gp',
        '.3g2',
      ],
    },
  },
];

/**
 * See https://web.dev/patterns/files/open-one-or-multiple-files/
 */
type AcceptTypes = 'Any' | 'Images' | 'Videos' | 'Audios';
function openFileOrFiles(options: {
  accept?: AcceptTypes;
}): Promise<File | null>;
function openFileOrFiles(options: {
  accept?: AcceptTypes;
  multiple: false;
}): Promise<File | null>;
function openFileOrFiles(options: {
  accept?: AcceptTypes;
  multiple: true;
}): Promise<File[] | null>;
async function openFileOrFiles({ accept = 'Any', multiple = false } = {}) {
  // Feature detection. The API needs to be supported
  // and the app not run in an iframe.
  const supportsFileSystemAccess =
    'showOpenFilePicker' in window &&
    (() => {
      try {
        return window.self === window.top;
      } catch {
        return false;
      }
    })();
  // If the File System Access API is supported…
  if (supportsFileSystemAccess && window.showOpenFilePicker) {
    try {
      const fileType = FileTypes.find(i => i.description === accept);
      const pickerOpts = {
        types: fileType ? [fileType] : undefined,
        multiple,
      } satisfies OpenFilePickerOptions;
      // Show the file picker, optionally allowing multiple files.
      const handles = await window.showOpenFilePicker(pickerOpts);
      // Only one file is requested.
      if (!multiple) {
        // Add the `FileSystemFileHandle` as `.handle`.
        const file = await handles[0].getFile();
        // Add the `FileSystemFileHandle` as `.handle`.
        // file.handle = handles[0];
        return file;
      } else {
        const files = await Promise.all(
          handles.map(async handle => {
            const file = await handle.getFile();
            // Add the `FileSystemFileHandle` as `.handle`.
            // file.handle = handles[0];
            return file;
          })
        );
        return files;
      }
    } catch (err) {
      if (!(err instanceof Error)) throw err;
      // Fail silently if the user has simply canceled the dialog.
      if (err.name !== 'AbortError') throw err;
      return null;
    }
  }
  // Fallback if the File System Access API is not supported.
  return new Promise(resolve => {
    // Append a new `<input type="file" multiple? />` and hide it.
    const input = document.createElement('input');
    input.style.display = 'none';
    input.type = 'file';
    if (multiple) {
      input.multiple = true;
    }
    if (accept !== 'Any') {
      // For example, `accept="image/*"` or `accept="video/*,audio/*"`.
      input.accept = Object.keys(
        FileTypes.find(i => i.description === accept)?.accept ?? ''
      ).join(',');
    }
    document.body.append(input);
    // The `change` event fires when the user interacts with the dialog.
    input.addEventListener('change', () => {
      // Remove the `<input type="file" multiple? />` again from the DOM.
      input.remove();
      // If no files were selected, return.
      if (!input.files) {
        resolve(null);
        return;
      }
      // Return all files or just one file.
      if (multiple) {
        resolve(Array.from(input.files));
        return;
      }
      resolve(input.files[0]);
    });
    // Show the picker.
    if ('showPicker' in HTMLInputElement.prototype) {
      input.showPicker();
    } else {
      input.click();
    }
  });
}

export const uploadImageFromLocal = async (storage: BlobManager) => {
  const imageFiles = await openFileOrFiles({
    accept: 'Images',
    multiple: true,
  });
  if (!imageFiles) return [];
  const res: { file: File; sourceId: string }[] = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const sourceId = await storage.set(file);
    res.push({ file, sourceId });
  }
  return res;
};

type BookmarkProps = Partial<BookmarkBlockModel>;

export async function getBookmarkInitialProps(): Promise<BookmarkProps[]> {
  const bookmarkCreateModal = document.createElement('bookmark-create-modal');

  let resolvePromise: (
    value: Array<BookmarkProps> | PromiseLike<Array<BookmarkProps>>
  ) => void;
  const pending = new Promise<Array<BookmarkProps>>(resolve => {
    resolvePromise = resolve;
  });

  bookmarkCreateModal.onCancel = () => {
    resolvePromise([]);
    document.body.removeChild(bookmarkCreateModal);
  };
  bookmarkCreateModal.onConfirm = ({ url }) => {
    resolvePromise([{ flavour: 'affine:bookmark', url }]);
    document.body.removeChild(bookmarkCreateModal);
  };

  document.body.appendChild(bookmarkCreateModal);

  return await pending;
}
