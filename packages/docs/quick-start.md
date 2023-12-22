# Quick Start

The `@blocksuite/presets` package contains the prebuilt editors and opt-in additional UI components. Its `nightly` versions are released daily based on the master branch, which is also recommended for real world usage:

```sh
pnpm i @blocksuite/presets@nightly
```

Then you can use the prebuilt `DocEditor` out of the box, with an initialized `page` instance attached as its document model:

::: code-sandbox {coderHeight=220 previewHeight=500}

```ts /index.ts [active]
import '@blocksuite/presets/themes/affine.css';
import { createEmptyPage, DocEditor } from '@blocksuite/presets';

const page = createEmptyPage().init();
const editor = new DocEditor();
editor.page = page;
document.body.appendChild(editor);
```

:::

The `DocEditor` here is a standard web component that can also be reused with `<doc-editor>` HTML tag. All first-party components within BlockSuite are implemented as web components. This approach not only ensures the stability of rich text editing by leveraging the native DOM component model, but also makes BlockSuite framework-agnostic.

You can also try replacing the `DocEditor` with the `EdgelessEditor` whiteboard in the same manner. In the subsequent sections, we will guide you through more fundamental components of BlockSuite.
