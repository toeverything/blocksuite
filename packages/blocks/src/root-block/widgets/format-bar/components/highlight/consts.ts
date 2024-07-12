interface HighlightConfig {
  color: null | string;
  hotkey: null | string;
  name: string;
}

const colors = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'grey',
];

export const backgroundConfig: HighlightConfig[] = [
  {
    color: null,
    hotkey: null,
    name: 'Default Background',
  },
  ...colors.map(color => ({
    color: `var(--affine-text-highlight-${color})`,
    hotkey: null,
    name: `${color[0].toUpperCase()}${color.slice(1)} Background`,
  })),
];

export const foregroundConfig: HighlightConfig[] = [
  {
    color: null,
    hotkey: null,
    name: 'Default Color',
  },
  ...colors.map(color => ({
    color: `var(--affine-text-highlight-foreground-${color})`,
    hotkey: null,
    name: `${color[0].toUpperCase()}${color.slice(1)}`,
  })),
];
