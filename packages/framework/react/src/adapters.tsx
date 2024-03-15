import {
  BiDirectionalLinkPanel,
  DocMetaTags,
  DocTitle,
  EdgelessEditor,
  PageEditor,
} from '@blocksuite/presets';
import React from 'react';

import { createReactComponentFromLit } from './lit-react/index.js';

export const adapted = {
  DocEditor: createReactComponentFromLit({
    react: React,
    elementClass: PageEditor,
  }),
  DocTitle: createReactComponentFromLit({
    react: React,
    elementClass: DocTitle,
  }),
  PageMetaTags: createReactComponentFromLit({
    react: React,
    elementClass: DocMetaTags,
  }),
  EdgelessEditor: createReactComponentFromLit({
    react: React,
    elementClass: EdgelessEditor,
  }),
  BiDirectionalLinkPanel: createReactComponentFromLit({
    react: React,
    elementClass: BiDirectionalLinkPanel,
  }),
};
