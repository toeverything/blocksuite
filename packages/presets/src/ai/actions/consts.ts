export const EXCLUDING_COPY_ACTIONS = [
  'brainstormMindmap',
  'expandMindmap',
  'makeItReal',
  'createSlides',
  'createImage',
  'findActions',
  'filterImage',
  'processImage',
];

export const EXCLUDING_INSERT_ACTIONS = ['generateCaption'];

export const IMAGE_ACTIONS = ['createImage', 'processImage', 'filterImage'];

const commonImageStages = ['Generating image', 'Rendering image'];

export const generatingStages: {
  [key in keyof Partial<BlockSuitePresets.AIActions>]: string[];
} = {
  brainstormMindmap: ['Thinking about this topic', 'Rendering mindmap'],
  createImage: commonImageStages,
  createSlides: ['Thinking about this topic', 'Rendering slides'],
  filterImage: commonImageStages,
  makeItReal: ['Coding for you', 'Rendering the code'],
  processImage: commonImageStages,
};

export const INSERT_ABOVE_ACTIONS = ['createHeadings'];
