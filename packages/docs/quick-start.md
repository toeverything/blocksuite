# Quick Start

The `@blocksuite/presets` package contains the prebuilt editors and opt-in additional UI components. Its `nightly` versions are released daily based on the master branch, which is also recommended for real world usage:

```sh
pnpm i @blocksuite/presets@nightly
```

Then you can use the prebuilt `DocEditor` out of the box, with a `page` instance attached as the document model:

::: code-sandbox

```ts /index.ts [active] {coderHeight=180 previewHeight=500}
import '@blocksuite/presets/themes/affine.css';

import { createDefaultPage, DocEditor } from '@blocksuite/presets';

const page = createDefaultPage();
const editor = new DocEditor();
editor.page = page;
document.body.appendChild(editor);
```

:::
