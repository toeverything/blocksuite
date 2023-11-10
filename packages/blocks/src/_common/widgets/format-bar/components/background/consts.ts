interface BackgroundConfig {
  name: string;
  color: string | null;
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

export const backgroundConfig: BackgroundConfig[] = [
  {
    name: 'Default Background',
    color: null,
    hotkey: null,
  },
  ...colors
    .filter(color => color !== 'pink')
    .map(color => ({
      name: `${color[0].toUpperCase()}${color.slice(1)} Background`,
      color: `var(--affine-text-highlight-${color})`,
      hotkey: null,
    })),
];
