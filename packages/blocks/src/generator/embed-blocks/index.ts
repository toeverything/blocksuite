import { noop } from '@blocksuite/global/utils';

import { GithubBlock, githubBlockSpec } from './embed-github-block/index.js';

noop(GithubBlock);

export const embedBlocks = [githubBlockSpec];
