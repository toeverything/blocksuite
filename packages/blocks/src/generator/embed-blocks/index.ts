import { noop } from '@blocksuite/global/utils';

import { GithubBlock, githubBlockSpec } from './github-block/index.js';

noop(GithubBlock);

export const embedBlocks = [githubBlockSpec];
