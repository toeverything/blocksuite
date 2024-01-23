type Section = {
  title: string;
  content: string;
  illustrationKeyWords: string;
};
type Frame = {
  name: string;
  /**
   * max 4 sections, min 1 section
   */
  sections: Section[];
};

export type PPTData = Frame[];
