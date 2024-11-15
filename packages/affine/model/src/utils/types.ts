export type EmbedCardStyle =
  | 'horizontal'
  | 'horizontalThin'
  | 'list'
  | 'vertical'
  | 'cube'
  | 'cubeThick'
  | 'video'
  | 'figma'
  | 'html'
  | 'syncedDoc'
  | 'pdf';

export type LinkPreviewData = {
  description: string | null;
  icon: string | null;
  image: string | null;
  title: string | null;
};
