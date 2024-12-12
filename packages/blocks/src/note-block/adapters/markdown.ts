import { NoteBlockSchema, NoteDisplayMode } from '@blocksuite/affine-model';
import {
  BlockMarkdownAdapterExtension,
  type BlockMarkdownAdapterMatcher,
} from '@blocksuite/affine-shared/adapters';

/**
 * Create a markdown adapter matcher for note block.
 *
 * @param displayModeToSkip - The note with specific display mode to skip.
 * For example, the note with display mode `EdgelessOnly` should not be converted to markdown when current editor mode is `Doc`.
 * @returns The markdown adapter matcher.
 */
const createNoteBlockMarkdownAdapterMatcher = (
  displayModeToSkip: NoteDisplayMode
): BlockMarkdownAdapterMatcher => ({
  flavour: NoteBlockSchema.model.flavour,
  toMatch: () => false,
  fromMatch: o => o.node.flavour === NoteBlockSchema.model.flavour,
  toBlockSnapshot: {},
  fromBlockSnapshot: {
    enter: (o, context) => {
      const node = o.node;
      if (node.props.displayMode === displayModeToSkip) {
        context.walkerContext.skipAllChildren();
      }
    },
  },
});

export const docNoteBlockMarkdownAdapterMatcher =
  createNoteBlockMarkdownAdapterMatcher(NoteDisplayMode.EdgelessOnly);

export const edgelessNoteBlockMarkdownAdapterMatcher =
  createNoteBlockMarkdownAdapterMatcher(NoteDisplayMode.DocOnly);

export const DocNoteBlockMarkdownAdapterExtension =
  BlockMarkdownAdapterExtension(docNoteBlockMarkdownAdapterMatcher);

export const EdgelessNoteBlockMarkdownAdapterExtension =
  BlockMarkdownAdapterExtension(edgelessNoteBlockMarkdownAdapterMatcher);
