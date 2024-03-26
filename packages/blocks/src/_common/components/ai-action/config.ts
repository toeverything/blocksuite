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
  action?: () => void;
  subConfig?: AIActionSubConfigItem[];
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
    },
  ],
};

export const EditActionGroup: AIActionConfigGroup = {
  name: 'edit',
  items: [
    {
      name: 'Translate to',
      icon: LanguageIcon,
      subConfig: TranslateSubConfig,
    },
    {
      name: 'Change tone to',
      icon: ToneIcon,
      subConfig: ToneSubConfig,
    },
    {
      name: 'Improve writing for it',
      icon: ImproveWritingIcon,
    },
    {
      name: 'Improve grammar for it',
      icon: AIDoneIcon,
    },
    {
      name: 'Fix spelling for it',
      icon: AIDoneIcon,
    },
    {
      name: 'Create headings',
      icon: AIPenIcon,
    },
    {
      name: 'Make longer',
      icon: LongerIcon,
    },
    {
      name: 'Make shorter',
      icon: ShorterIcon,
    },
  ],
};

export const DraftActionGroup: AIActionConfigGroup = {
  name: 'draft',
  items: [
    {
      name: 'Write an article about this',
      icon: AIPenIcon,
    },
    {
      name: 'Write a Twitter about this',
      icon: AIPenIcon,
    },
    {
      name: 'Write a poem about this',
      icon: AIPenIcon,
    },
    {
      name: 'Write a blog post about this',
      icon: AIPenIcon,
    },
    {
      name: 'Brainstorm ideas about this',
      icon: AIPenIcon,
    },
    {
      name: 'Write a outline from this',
      icon: AIPenIcon,
    },
  ],
};

export const MindMapActionGroup: AIActionConfigGroup = {
  name: 'mindMap',
  items: [
    {
      name: 'Explain from this mind-map node',
      icon: ExplainIcon,
    },
    {
      name: 'Brainstorm ideas with mind-map',
      icon: ExplainIcon,
    },
  ],
};

export const CreateActionGroup: AIActionConfigGroup = {
  name: 'create',
  items: [
    {
      name: 'Make it real',
      icon: MakeItRealIcon,
    },
  ],
};

export const CodeActionGroup: AIActionConfigGroup = {
  name: 'code',
  items: [
    {
      name: 'Check code error',
      icon: AIPenIcon,
    },
  ],
};

export const PresentationActionGroup: AIActionConfigGroup = {
  name: 'presentation',
  items: [
    {
      name: 'Create a presentation',
      icon: AIPenIcon,
    },
  ],
};

export const DrawActionGroup: AIActionConfigGroup = {
  name: 'draw',
  items: [
    {
      name: 'Make it real',
      icon: MakeItRealIcon,
    },
  ],
};

export const OthersActionGroup: AIActionConfigGroup = {
  name: 'others',
  items: [
    {
      name: 'Summary the webpage',
      icon: AIPenIcon,
    },
    {
      name: 'Explain this image',
      icon: AIPenIcon,
    },
    {
      name: 'Explain this code',
      icon: AIPenIcon,
    },
    {
      name: 'Find action items from it',
      icon: AISearchIcon,
    },
    {
      name: 'Explain this',
      icon: ExplainIcon,
    },
    {
      name: 'Add tag for this doc',
      icon: TagIcon,
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
