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
  | 'syncedDoc';

export type LinkPreviewData = {
  description: string | null;
  icon: string | null;
  image: string | null;
  title: string | null;
};

export type ShapeType = 'rect' | 'triangle' | 'ellipse' | 'diamond';
export type ShapeStyle = 'General' | 'Scribbled';
