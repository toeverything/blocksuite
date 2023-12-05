import type { TestUtils } from '@blocksuite/blocks';
import type { ContentParser } from '@blocksuite/blocks/content-parser';
import type { EditorContainer } from '@blocksuite/presets';
import type {
  BlockSchema,
  DocProvider,
  Page,
  Workspace,
} from '@blocksuite/store';
import type { Job } from '@blocksuite/store';
import type { z } from 'zod';

declare global {
  interface Window {
    editor: EditorContainer;
    page: Page;
    workspace: Workspace;
    blockSchemas: z.infer<typeof BlockSchema>[];
    ContentParser: typeof ContentParser;
    job: Job;
    Y: typeof Workspace.Y;
    std: typeof std;
    testUtils: TestUtils;

    // TODO: remove this when provider support subdocument
    subdocProviders: Map<string, DocProvider[]>;
  }
}
