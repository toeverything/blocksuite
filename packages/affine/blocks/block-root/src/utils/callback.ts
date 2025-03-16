import type { BlockComponent, EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

// Run the callback until a model's element updated.
// Please notice that the callback will be called **once the element itself is ready**.
// The children may be not updated.
// If you want to wait for the text elements,
// please use `onModelTextUpdated`.
export async function onModelElementUpdated(
  editorHost: EditorHost,
  model: BlockModel,
  callback: (block: BlockComponent) => void
) {
  const page = model.doc;
  if (!page.root) return;

  const rootComponent = editorHost.view.getBlock(page.root.id);
  if (!rootComponent) return;
  await rootComponent.updateComplete;

  const element = editorHost.view.getBlock(model.id);
  if (element) callback(element);
}
