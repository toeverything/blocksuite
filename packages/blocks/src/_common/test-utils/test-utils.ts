import { updateBlockElementType } from '../../page-block/utils/operations/element/block-level.js';
import {
  mergeToCodeModel,
  transformModel,
} from '../../page-block/utils/operations/model.js';
import { getSelectedContentModels } from '../../page-block/utils/selection.js';

class PageTestUtils {
  // block element operations (ui layer)
  updateBlockElementType = updateBlockElementType;

  // block model operations (data layer)
  mergeToCodeModel = mergeToCodeModel;
  transformModel = transformModel;

  // selection
  getSelectedContentModels = getSelectedContentModels;
}

export class TestUtils {
  pageBlock = new PageTestUtils();
}

import type { BlockSnapshot } from '@blocksuite/store';

export function logJson(ast: unknown) {
  console.log(JSON.stringify(ast, null, 2));
}

export function nanoidReplacement(snapshot: BlockSnapshot) {
  return JSON.parse(nanoidReplacementString(JSON.stringify(snapshot)));
}

const escapedSnapshotAttributes = [
  '"attributes"',
  '"conditions"',
  '"iconColumn"',
];

function nanoidReplacementString(snapshotString: string) {
  const re =
    /("block:[A-Za-z0-9-_]{10}")|("[A-Za-z0-9-_]{10}")|("var\(--affine-tag-[a-z]{3,10}\)")|("[A-Za-z0-9-_=]{44}")/g;
  const matches = snapshotString.matchAll(re);
  const matchesReplaceMap = new Map();
  let escapedNumber = 0;
  Array.from(matches).map((match, index) => {
    if (escapedSnapshotAttributes.includes(match[0])) {
      matchesReplaceMap.set(match[0], match[0]);
      escapedNumber++;
    } else {
      matchesReplaceMap.set(
        match[0],
        `"matchesReplaceMap[${index - escapedNumber}]"`
      );
    }
  });
  return snapshotString.replace(re, match => matchesReplaceMap.get(match));
}
