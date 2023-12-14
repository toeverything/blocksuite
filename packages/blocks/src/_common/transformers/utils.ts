import { assertExists } from '@blocksuite/global/utils';
import { getAssetName } from '@blocksuite/store';
import JSZip from 'jszip';

export function createAssetsArchive(
  assetsMap: Map<string, Blob>,
  assetsIds: string[]
) {
  const zip = new JSZip();

  const assets = zip.folder('assets');
  assertExists(assetsMap);

  assetsMap.forEach((blob, id) => {
    if (!assetsIds.includes(id)) return;
    assets?.file(getAssetName(assetsMap, id), blob);
  });

  return zip;
}

export function download(blob: Blob, name: string) {
  const element = document.createElement('a');
  element.setAttribute('download', name);
  const fileURL = URL.createObjectURL(blob);
  element.setAttribute('href', fileURL);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(fileURL);
}
