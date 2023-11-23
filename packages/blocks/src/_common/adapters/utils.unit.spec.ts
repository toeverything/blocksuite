import type { BlockSnapshot } from '@blocksuite/store';

export function nanoidReplacement(snapshot: BlockSnapshot) {
  return JSON.parse(nanoidReplacementString(JSON.stringify(snapshot)));
}

function nanoidReplacementString(snapshotString: string) {
  const matches = snapshotString.matchAll(/"block:[A-Za-z0-9-_]{10}"/g);
  const matchesReplaceMap = new Map();
  Array.from(matches).map((match, index) =>
    matchesReplaceMap.set(match[0], `"matchesReplaceMap[${index}]"`)
  );
  return snapshotString.replace(/"block:[A-Za-z0-9-_]{10}"/g, match =>
    matchesReplaceMap.get(match)
  );
}
