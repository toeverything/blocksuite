export const isFSSupported = () => {
  return typeof window.showDirectoryPicker === 'function';
};

const readWriteOptions: FileSystemHandlePermissionDescriptor = {
  mode: 'readwrite',
};

export const setRootDirectory = async () => {
  const handle = await window.showDirectoryPicker();
  if (!handle) {
    return undefined;
  }
  let granted = (await handle.queryPermission(readWriteOptions)) === 'granted';
  if (!granted) {
    granted = (await handle.requestPermission(readWriteOptions)) === 'granted';
  }
  return { handle, granted };
};

export const getFileHandle = async (
  name: string,
  directoryHandle: FileSystemDirectoryHandle
): Promise<FileSystemFileHandle | undefined> => {
  for await (const handle of directoryHandle.values()) {
    const relativePath = (await directoryHandle.resolve(handle)) || [];
    if (relativePath?.length === 1 && relativePath[0] === name) {
      if (handle.isFile) {
        return handle;
      }
    }
  }
  return undefined;
};

export const createFileHandle = async (
  name: string,
  directoryHandle: FileSystemDirectoryHandle
): Promise<FileSystemFileHandle | undefined> => {
  return await directoryHandle.getFileHandle(name, { create: true });
};

export const writeContentToFile = async (
  fileHandle: FileSystemFileHandle,
  content: FileSystemWriteChunkType
) => {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};
