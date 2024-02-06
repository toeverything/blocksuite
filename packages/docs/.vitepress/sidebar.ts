import { DefaultTheme } from 'vitepress';

export const guide: DefaultTheme.NavItem[] = [
  {
    text: 'Introduction',
    items: [
      { text: 'Overview', link: 'guide/overview' },
      { text: 'Quick Start', link: 'guide/quick-start' },
    ],
  },
  {
    text: 'Framework Guide',
    items: [
      { text: 'Component Types', link: 'guide/component-types' },
      {
        text: 'Working with Block Tree',
        // @ts-ignore
        link: 'guide/working-with-block-tree',
        items: [
          {
            text: 'Block Tree Basics',
            link: 'guide/working-with-block-tree#block-tree-basics',
          },
          {
            text: 'Block Tree in Editor',
            link: 'guide/working-with-block-tree#block-tree-in-editor',
          },
          {
            text: 'Selecting Blocks',
            link: 'guide/working-with-block-tree#selecting-blocks',
          },
          {
            text: 'Service and Commands',
            link: 'guide/working-with-block-tree#service-and-commands',
          },
          {
            text: 'Defining New Blocks',
            link: 'guide/working-with-block-tree#defining-new-blocks',
          },
        ],
      },
      { text: 'Data Synchronization', link: 'guide/data-synchronization' },
    ],
  },
  {
    text: 'Framework Handbook',
    items: [
      {
        text: '<code>block-std</code>',
        items: [
          {
            text: 'Block Spec',
            link: 'guide/block-spec',
            // @ts-ignore
            items: [
              { text: 'Block Schema', link: 'guide/block-schema' },
              { text: 'Block Service', link: 'guide/block-service' },
              { text: 'Block View', link: 'guide/block-view' },
              { text: 'Block Widgets', link: 'guide/block-widgets' },
            ],
          },
          {
            text: 'Selection',
            link: 'guide/selection',
          },
          { text: 'Event', link: 'guide/event' },
          { text: 'Command', link: 'guide/command' },
        ],
      },
      {
        text: '<code>store</code>',
        items: [
          { text: 'Page', link: 'guide/store#page' },
          { text: 'Workspace', link: 'guide/store#workspace' },
          { text: 'Slot', link: 'guide/slot' },
          { text: 'Adapter', link: 'guide/adapter' },
        ],
      },
      {
        text: '<code>inline</code>',
        link: 'guide/inline',
      },
      {
        text: '<code>lit</code>',
        link: 'guide/lit',
      },
    ],
  },
  {
    text: 'Developing BlockSuite',
    items: [
      {
        text: 'Building Packages',
        link: '//github.com/toeverything/blocksuite/blob/master/BUILDING.md',
      },
      {
        text: 'Running Tests',
        link: '//github.com/toeverything/blocksuite/blob/master/BUILDING.md#testing',
      },
    ],
  },
];

export const reference: DefaultTheme.NavItem[] = [
  {
    text: 'API Reference',
    items: [
      { text: '@blocksuite/store', link: 'api/@blocksuite/store/index' },
      {
        text: '@blocksuite/block-std',
        link: 'api/@blocksuite/block-std/index',
      },
      { text: '@blocksuite/lit', link: 'api/@blocksuite/lit/index' },
      { text: '@blocksuite/inline', link: 'api/@blocksuite/inline/index' },
      {
        text: '@blocksuite/presets',
        link: 'api/@blocksuite/presets/index',
      },
      { text: '@blocksuite/blocks', link: 'api/@blocksuite/blocks/index' },
    ],
  },
];

export const components: DefaultTheme.NavItem[] = [
  {
    text: 'Introduction',
    items: [
      { text: 'Overview', link: 'components/overview' },
      {
        text: 'AFFiNE Integration',
        link: 'components/overview#affine-integration',
      },
    ],
  },
  {
    text: 'Editors',
    items: [
      { text: '📝 DocEditor', link: 'components/doc-editor' },
      { text: '🎨 EdgelessEditor', link: 'components/edgeless-editor' },
    ],
  },
  {
    text: 'Blocks 🚧',
    items: [
      {
        text: 'Regular Blocks',
        items: [
          { text: 'Page Block', link: '' },
          { text: 'Note Block', link: '' },
          { text: 'Paragraph Block', link: '' },
          { text: 'List Block', link: '' },
          { text: 'Code Block', link: '' },
          { text: 'Image Block', link: '' },
          { text: 'Attachment Block', link: '' },
        ],
      },
      {
        text: 'Advanced Blocks',
        items: [
          { text: 'Surface Block', link: '' },
          { text: 'Database Block', link: '' },
          { text: 'Frame Block', link: '' },
          { text: 'Link Blocks', link: '' },
          { text: 'Embed Blocks', link: '' },
        ],
      },
    ],
  },
  {
    text: 'Widgets 🚧',
    items: [
      { text: 'Slash Menu', link: '' },
      { text: 'Format Bar', link: '' },
      { text: 'Drag Handle', link: '' },
    ],
  },
  {
    text: 'Fragments 🚧',
    items: [
      { text: 'Doc Title', link: '' },
      { text: 'Outline Panel', link: '' },
      { text: 'Frame Panel', link: '' },
      { text: 'Copilot Panel', link: '' },
      { text: 'Bi-Directional Link Panel', link: '' },
    ],
  },
];
