// TODO: support more file types, now is just image
export function getFileFromClipboard(clipboardData: DataTransfer) {
  const files = clipboardData.files;
  if (files && files[0] && files[0].type.indexOf('image') > -1) {
    return files[0];
  }
  return;
}
