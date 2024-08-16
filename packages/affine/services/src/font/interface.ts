export interface FontConfig {
  font: string;
  weight: string;
  url: string;
  style: string;
}

export interface FontService {
  ready: Promise<FontFace[]>;
  clear: () => void;
  load: (fonts: FontConfig[]) => void;
}
