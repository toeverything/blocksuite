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
  figure: TemplateResult;
  caption: string;
};

export const slashMenuToolTips: Record<string, SlashMenuTooltip> = {
  Text: {
    figure: TextTooltip,
    caption: 'Text',
  },

  'Heading 1': {
    figure: Heading1Tooltip,
    caption: 'Heading #1',
  },

  'Heading 2': {
    figure: Heading2Tooltip,
    caption: 'Heading #2',
  },

  'Heading 3': {
    figure: Heading3Tooltip,
    caption: 'Heading #3',
  },

  'Heading 4': {
    figure: Heading4Tooltip,
    caption: 'Heading #4',
  },

  'Heading 5': {
    figure: Heading5Tooltip,
    caption: 'Heading #5',
  },

  'Heading 6': {
    figure: Heading6Tooltip,
    caption: 'Heading #6',
  },

  'Code Block': {
    figure: CodeBlockTooltip,
    caption: 'Code Block',
  },

  Quote: {
    figure: QuoteTooltip,
    caption: 'Quote',
  },

  Divider: {
    figure: DividerTooltip,
    caption: 'Divider',
  },

  'Bulleted List': {
    figure: BulletedListTooltip,
    caption: 'Bulleted List',
  },

  'Numbered List': {
    figure: NumberedListTooltip,
    caption: 'Numbered List',
  },

  'To-do List': {
    figure: ToDoListTooltip,
    caption: 'To-do List',
  },

  Bold: {
    figure: BoldTextTooltip,
    caption: 'Bold Text',
  },

  Italic: {
    figure: ItalicTooltip,
    caption: 'Italic',
  },

  Underline: {
    figure: UnderlineTooltip,
    caption: 'Underline',
  },

  Strikethrough: {
    figure: StrikethroughTooltip,
    caption: 'Strikethrough',
  },

  'New Doc': {
    figure: NewDocTooltip,
    caption: 'New Doc',
  },

  'Linked Doc': {
    figure: LinkDocTooltip,
    caption: 'Link Doc',
  },

  Link: {
    figure: LinkTooltip,
    caption: 'Link',
  },

  Attachment: {
    figure: AttachmentTooltip,
    caption: 'Attachment',
  },

  Github: {
    figure: GithubRepoTooltip,
    caption: 'GitHub Repo',
  },

  YouTube: {
    figure: YoutubeVideoTooltip,
    caption: 'YouTube Video',
  },

  Image: {
    figure: PhotoTooltip,
    caption: 'Photo',
  },

  'X (Twitter)': {
    figure: TweetTooltip,
    caption: 'Tweet',
  },

  Figma: {
    figure: FigmaTooltip,
    caption: 'Figma',
  },

  Linear: {
    figure: LinearTooltip,
    caption: 'Linear',
  },

  Today: {
    figure: TodayTooltip,
    caption: 'Today',
  },

  Tomorrow: {
    figure: TomorrowTooltip,
    caption: 'Tomorrow',
  },

  Yesterday: {
    figure: YesterdayTooltip,
    caption: 'Yesterday',
  },

  Now: {
    figure: NowTooltip,
    caption: 'Now',
  },

  'Table View': {
    figure: TableViewTooltip,
    caption: 'Table View',
  },

  'Kanban View': {
    figure: KanbanViewTooltip,
    caption: 'Kanban View',
  },

  'Move Up': {
    figure: MoveUpTooltip,
    caption: 'Move Up',
  },

  'Move Down': {
    figure: MoveDownTooltip,
    caption: 'Move Down',
  },

  Copy: {
    figure: CopyTooltip,
    caption: 'Copy / Duplicate',
  },

  Delete: {
    figure: DeleteTooltip,
    caption: 'Delete',
  },

  'Group & Frame': {
    figure: EdgelessTooltip,
    caption: 'Edgeless',
  },
};
