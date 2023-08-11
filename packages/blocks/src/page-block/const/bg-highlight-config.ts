interface BackgroundHighlightConfig {
  name: string;
  color: string;
  hotkey: string | null;
}

const colors = [
  'pink',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'grey',
];

export const backgroundHighlightConfig: BackgroundHighlightConfig[] = [
  {
    name: 'Default Background',
    color: 'unset',
    hotkey: null,
  },
  ...colors.map(color => ({
    name: `${color[0].toUpperCase()}${color.slice(1)} Background`,
    color: `var(--affine-texthighlight-${color})`,
    hotkey: null,
  })),
];
