export type SelectOptionColor = {
  color: string;
  name: string;
};

export const selectOptionColors: SelectOptionColor[] = [
  {
    color: 'var(--affine-tag-red)',
    name: 'Red',
  },
  {
    color: 'var(--affine-tag-pink)',
    name: 'Pink',
  },
  {
    color: 'var(--affine-tag-orange)',
    name: 'Orange',
  },
  {
    color: 'var(--affine-tag-yellow)',
    name: 'Yellow',
  },
  {
    color: 'var(--affine-tag-green)',
    name: 'Green',
  },
  {
    color: 'var(--affine-tag-teal)',
    name: 'Teal',
  },
  {
    color: 'var(--affine-tag-blue)',
    name: 'Blue',
  },
  {
    color: 'var(--affine-tag-purple)',
    name: 'Purple',
  },
  {
    color: 'var(--affine-tag-gray)',
    name: 'Gray',
  },
  {
    color: 'var(--affine-tag-white)',
    name: 'White',
  },
];

/** select tag color poll */
const selectTagColorPoll = selectOptionColors.map(color => color.color);

function tagColorHelper() {
  let colors = [...selectTagColorPoll];
  return () => {
    if (colors.length === 0) {
      colors = [...selectTagColorPoll];
    }
    const index = Math.floor(Math.random() * colors.length);
    const color = colors.splice(index, 1)[0];
    return color;
  };
}

export const getTagColor = tagColorHelper();
