import type { EditorHost } from '@blocksuite/block-std';
import type { TestUtils } from '@blocksuite/blocks';
import type { AffineEditorContainer } from '@blocksuite/presets';
import type { BlockSchema, Doc, DocCollection } from '@blocksuite/store';
import type { Job } from '@blocksuite/store';
import type { z } from 'zod';

declare global {
  type HTMLTemplate = [
    string,
    Record<string, unknown>,
    ...(HTMLTemplate | string)[],
  ];

  interface Window {
    Y: typeof DocCollection.Y;
    bcProvider: ReturnType<typeof setupBroadcastProvider>;
    blockSchemas: z.infer<typeof BlockSchema>[];
    collection: DocCollection;
    devtoolsFormatters: {
      body: (obj: unknown, config: unknown) => HTMLTemplate | null;
      hasBody: (obj: unknown, config: unknown) => boolean | null;
      header: (obj: unknown, config: unknown) => HTMLTemplate | null;
    }[];
    doc: Doc;
    editor: AffineEditorContainer;
    host: EditorHost;
    job: Job;
    std: typeof std;

    testUtils: TestUtils;
    testWorker: Worker;

    wsProvider: ReturnType<typeof setupBroadcastProvider>;
  }
}
