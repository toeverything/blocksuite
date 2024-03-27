import type { TemplateResult } from 'lit';

import {
  AIDoneIcon,
  AIPenIcon,
  AISearchIcon,
  ExplainIcon,
  ImproveWritingIcon,
  LanguageIcon,
  LongerIcon,
  MakeItRealIcon,
  ShorterIcon,
  TagIcon,
  ToneIcon,
} from '../../icons/ai.js';

// import type { AffineFormatBarWidget } from '../../format-bar.js';

export type AIActionGroup =
  | 'doc'
  | 'edit'
  | 'draft'
  | 'mindMap'
  | 'create'
  | 'code'
  | 'presentation'
  | 'draw'
  | 'others';

export interface AIActionSubConfigItem {
  type: string;
  action?: () => void;
}

export interface AIActionConfigItem {
  name: string;
  icon: TemplateResult | (() => HTMLElement);
  showWhen: () => boolean;
  subConfig?: AIActionSubConfigItem[];
  action?: () => void;
}

export interface AIActionConfigGroup {
  name: AIActionGroup;
  items: AIActionConfigItem[];
}

export const TranslateSubConfig: AIActionSubConfigItem[] = [
  { type: 'English' },
  { type: 'Spanish' },
  { type: 'German' },
  { type: 'French' },
  { type: 'Italian' },
  { type: 'Simplified Chinese' },
  { type: 'Traditional Chinese' },
  { type: 'Japanese' },
  { type: 'Russian' },
  { type: 'Korean' },
];

export const ToneSubConfig: AIActionSubConfigItem[] = [
  { type: 'professional' },
  { type: 'informal' },
  { type: 'friendly' },
  { type: 'critical' },
];

export const DocActionGroup: AIActionConfigGroup = {
  name: 'doc',
  items: [
    {
      name: 'Summary',
      icon: AIPenIcon,
      showWhen: () => true,
    },
  ],
};

export const EditActionGroup: AIActionConfigGroup = {
  name: 'edit',
  items: [
    {
      name: 'Translate to',
      icon: LanguageIcon,
      showWhen: () => true,
      subConfig: TranslateSubConfig,
    },
    {
      name: 'Change tone to',
      icon: ToneIcon,
      showWhen: () => true,
      subConfig: ToneSubConfig,
    },
    {
      name: 'Improve writing for it',
      icon: ImproveWritingIcon,
      showWhen: () => true,
    },
    {
      name: 'Improve grammar for it',
      icon: AIDoneIcon,
      showWhen: () => true,
    },
    {
      name: 'Fix spelling for it',
      icon: AIDoneIcon,
      showWhen: () => true,
    },
    {
      name: 'Create headings',
      icon: AIPenIcon,
      showWhen: () => true,
    },
    {
      name: 'Make longer',
      icon: LongerIcon,
      showWhen: () => true,
    },
    {
      name: 'Make shorter',
      icon: ShorterIcon,
      showWhen: () => true,
    },
  ],
};

export const DraftActionGroup: AIActionConfigGroup = {
  name: 'draft',
  items: [
    {
      name: 'Write an article about this',
      icon: AIPenIcon,
      showWhen: () => true,
    },
    {
      name: 'Write a Twitter about this',
      icon: AIPenIcon,
      showWhen: () => true,
    },
    {
      name: 'Write a poem about this',
      icon: AIPenIcon,
      showWhen: () => true,
    },
    {
      name: 'Write a blog post about this',
      icon: AIPenIcon,
      showWhen: () => true,
    },
    {
      name: 'Brainstorm ideas about this',
      icon: AIPenIcon,
      showWhen: () => true,
    },
    {
      name: 'Write a outline from this',
      icon: AIPenIcon,
      showWhen: () => true,
    },
  ],
};

export const MindMapActionGroup: AIActionConfigGroup = {
  name: 'mindMap',
  items: [
    {
      name: 'Explain from this mind-map node',
      icon: ExplainIcon,
      showWhen: () => true,
    },
    {
      name: 'Brainstorm ideas with mind-map',
      icon: ExplainIcon,
      showWhen: () => true,
    },
  ],
};

export const CreateActionGroup: AIActionConfigGroup = {
  name: 'create',
  items: [
    {
      name: 'Make it real',
      icon: MakeItRealIcon,
      showWhen: () => true,
    },
  ],
};

export const CodeActionGroup: AIActionConfigGroup = {
  name: 'code',
  items: [
    {
      name: 'Check code error',
      icon: AIPenIcon,
      showWhen: () => true,
    },
  ],
};

export const PresentationActionGroup: AIActionConfigGroup = {
  name: 'presentation',
  items: [
    {
      name: 'Create a presentation',
      icon: AIPenIcon,
      showWhen: () => true,
    },
  ],
};

export const DrawActionGroup: AIActionConfigGroup = {
  name: 'draw',
  items: [
    {
      name: 'Make it real',
      icon: MakeItRealIcon,
      showWhen: () => true,
    },
  ],
};

export const OthersActionGroup: AIActionConfigGroup = {
  name: 'others',
  items: [
    {
      name: 'Summary the webpage',
      icon: AIPenIcon,
      showWhen: () => true,
    },
    {
      name: 'Explain this image',
      icon: AIPenIcon,
      showWhen: () => true,
    },
    {
      name: 'Explain this code',
      icon: AIPenIcon,
      showWhen: () => true,
    },
    {
      name: 'Find action items from it',
      icon: AISearchIcon,
      showWhen: () => true,
    },
    {
      name: 'Explain this',
      icon: ExplainIcon,
      showWhen: () => true,
    },
    {
      name: 'Add tag for this doc',
      icon: TagIcon,
      showWhen: () => true,
    },
  ],
};

export const AIActionConfig: AIActionConfigGroup[] = [
  DocActionGroup,
  EditActionGroup,
  DraftActionGroup,
  MindMapActionGroup,
  CreateActionGroup,
  CodeActionGroup,
  PresentationActionGroup,
  DrawActionGroup,
  OthersActionGroup,
];
