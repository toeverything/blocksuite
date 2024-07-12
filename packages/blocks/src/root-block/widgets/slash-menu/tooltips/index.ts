import type { TemplateResult } from 'lit';

import { AttachmentTooltip } from './attachment.js';
import { BoldTextTooltip } from './bold-text.js';
import { BulletedListTooltip } from './bulleted-list.js';
import { CodeBlockTooltip } from './code-block.js';
import { CopyTooltip } from './copy.js';
import { DeleteTooltip } from './delete.js';
import { DividerTooltip } from './divider.js';
import { EdgelessTooltip } from './edgeless.js';
import { FigmaTooltip } from './figma.js';
import { GithubRepoTooltip } from './github-repo.js';
import { Heading1Tooltip } from './heading-1.js';
import { Heading2Tooltip } from './heading-2.js';
import { Heading3Tooltip } from './heading-3.js';
import { Heading4Tooltip } from './heading-4.js';
import { Heading5Tooltip } from './heading-5.js';
import { Heading6Tooltip } from './heading-6.js';
import { ItalicTooltip } from './italic.js';
import { KanbanViewTooltip } from './kanban-view.js';
import { LinearTooltip } from './linear.js';
import { LinkTooltip } from './link.js';
import { LinkDocTooltip } from './link-doc.js';
import { MoveDownTooltip } from './move-down.js';
import { MoveUpTooltip } from './move-up.js';
import { NewDocTooltip } from './new-doc.js';
import { NowTooltip } from './now.js';
import { NumberedListTooltip } from './numbered-list.js';
import { PhotoTooltip } from './photo.js';
import { QuoteTooltip } from './quote.js';
import { StrikethroughTooltip } from './strikethrough.js';
import { TableViewTooltip } from './table-view.js';
import { TextTooltip } from './text.js';
import { ToDoListTooltip } from './to-do-list.js';
import { TodayTooltip } from './today.js';
import { TomorrowTooltip } from './tomorrow.js';
import { TweetTooltip } from './tweet.js';
import { UnderlineTooltip } from './underline.js';
import { YesterdayTooltip } from './yesterday.js';
import { YoutubeVideoTooltip } from './youtube-video.js';

export type SlashMenuTooltip = {
  caption: string;
  figure: TemplateResult;
};

export const slashMenuToolTips: Record<string, SlashMenuTooltip> = {
  Attachment: {
    caption: 'Attachment',
    figure: AttachmentTooltip,
  },

  Bold: {
    caption: 'Bold Text',
    figure: BoldTextTooltip,
  },

  'Bulleted List': {
    caption: 'Bulleted List',
    figure: BulletedListTooltip,
  },

  'Code Block': {
    caption: 'Code Block',
    figure: CodeBlockTooltip,
  },

  Copy: {
    caption: 'Copy / Duplicate',
    figure: CopyTooltip,
  },

  Delete: {
    caption: 'Delete',
    figure: DeleteTooltip,
  },

  Divider: {
    caption: 'Divider',
    figure: DividerTooltip,
  },

  Figma: {
    caption: 'Figma',
    figure: FigmaTooltip,
  },

  Github: {
    caption: 'GitHub Repo',
    figure: GithubRepoTooltip,
  },

  'Group & Frame': {
    caption: 'Edgeless',
    figure: EdgelessTooltip,
  },

  'Heading 1': {
    caption: 'Heading #1',
    figure: Heading1Tooltip,
  },

  'Heading 2': {
    caption: 'Heading #2',
    figure: Heading2Tooltip,
  },

  'Heading 3': {
    caption: 'Heading #3',
    figure: Heading3Tooltip,
  },

  'Heading 4': {
    caption: 'Heading #4',
    figure: Heading4Tooltip,
  },

  'Heading 5': {
    caption: 'Heading #5',
    figure: Heading5Tooltip,
  },

  'Heading 6': {
    caption: 'Heading #6',
    figure: Heading6Tooltip,
  },

  Image: {
    caption: 'Photo',
    figure: PhotoTooltip,
  },

  Italic: {
    caption: 'Italic',
    figure: ItalicTooltip,
  },

  'Kanban View': {
    caption: 'Kanban View',
    figure: KanbanViewTooltip,
  },

  Linear: {
    caption: 'Linear',
    figure: LinearTooltip,
  },

  Link: {
    caption: 'Link',
    figure: LinkTooltip,
  },

  'Linked Doc': {
    caption: 'Link Doc',
    figure: LinkDocTooltip,
  },

  'Move Down': {
    caption: 'Move Down',
    figure: MoveDownTooltip,
  },

  'Move Up': {
    caption: 'Move Up',
    figure: MoveUpTooltip,
  },

  'New Doc': {
    caption: 'New Doc',
    figure: NewDocTooltip,
  },

  Now: {
    caption: 'Now',
    figure: NowTooltip,
  },

  'Numbered List': {
    caption: 'Numbered List',
    figure: NumberedListTooltip,
  },

  Quote: {
    caption: 'Quote',
    figure: QuoteTooltip,
  },

  Strikethrough: {
    caption: 'Strikethrough',
    figure: StrikethroughTooltip,
  },

  'Table View': {
    caption: 'Table View',
    figure: TableViewTooltip,
  },

  Text: {
    caption: 'Text',
    figure: TextTooltip,
  },

  'To-do List': {
    caption: 'To-do List',
    figure: ToDoListTooltip,
  },

  Today: {
    caption: 'Today',
    figure: TodayTooltip,
  },

  Tomorrow: {
    caption: 'Tomorrow',
    figure: TomorrowTooltip,
  },

  Underline: {
    caption: 'Underline',
    figure: UnderlineTooltip,
  },

  'X (Twitter)': {
    caption: 'Tweet',
    figure: TweetTooltip,
  },

  Yesterday: {
    caption: 'Yesterday',
    figure: YesterdayTooltip,
  },

  YouTube: {
    caption: 'YouTube Video',
    figure: YoutubeVideoTooltip,
  },
};
