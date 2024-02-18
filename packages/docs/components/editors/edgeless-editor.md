# Edgeless Editor

This editor component offers a canvas with infinite logical dimensions, suitable for whiteboard and graphic editing.

<iframe src="https://try-blocksuite.vercel.app/starter/?init&mode=edgeless" frameborder="no" width="100%" height="500"></iframe>

## Features

- All the rich text editing capabilities in the [doc editor](./doc-editor).
- `CanvasElement` rendered to HTML5 canvas, including shapes, brushes, connectors, and text.
- Use of [frames](../blocks/frame-block) to denote canvas areas of any size.
- Presentation mode achieved by switching between multiple frames in sequence.
- Nestable group elements.
- Various [link cards](../blocks/link-blocks) that can be inserted on top of the canvas.
- Customizable toolbars and other widgets.

## Usage

```ts
import { EdgelessEditor } from '@blocksuite/presets';

const editor = new EdgelessEditor();
```

## Integration

Like all BlockSuite editors, the editor UI is entirely composed of the combination of [block specs](../../guide/block-spec). A specialized page block spec serves as the root node of the document and implements all top-level document UI, with main widgets also mounted on the page block. Accordingly, commonly used editing APIs are provided in the page service.

Specifically, the canvas element and some blocks that appear on the top layer of the canvas are located on the [surface block](../blocks/surface-block). Therefore, operating the edgeless editor also requires accessing the model and service mounted on this block.

To integrate and customize this editor, you can:

- [Customize new block specs](../../guide/working-with-block-tree#defining-new-blocks)
- 🚧 Configure widgets and customize new widgets
- 🚧 Use UI components from any framework

🚧 We are planning support for more frameworks.

## Reference

- [`EdgelessEditor`](/api/@blocksuite/presets/classes/EdgelessEditor.html)
- [`EdgelessPageService`](/api/@blocksuite/blocks/classes/EdgelessPageService.html)
- [`SurfaceBlockModel`](/api/@blocksuite/blocks/classes/SurfaceBlockModel.html)
- [`SurfaceService`](/api/@blocksuite/blocks/classes/SurfaceService.html)

Since `EdgelessEditor` is a native web component, all DOM-related properties are inherited.
