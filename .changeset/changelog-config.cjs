// @ts-check

/** @type import('@changesets/types').GetReleaseLine */
async function getReleaseLine(changeset) {
  let packages = changeset.releases.map(release => release.name);

  if (packages.length >= 2) {
    packages = packages.filter(packageName => packageName !== 'prosekit');
  }

  const packageLine = packages.map(formatModuleBadge).join(' ');

  let returnVal = `- ` + formatCommit(changeset.commit) + packageLine + '\n';

  for (const line of changeset.summary.split('\n')) {
    returnVal += `\n  ${line.trimEnd()}`;
  }

  return returnVal + '\n';
}

/**
 * @param {string} name
 */
function formatModuleBadge(name) {
  return `![](https://prosekit.dev/b/${name.split('/').at(-1)})`;
}

/**
 * @param {string | null | undefined} commit
 */
function formatCommit(commit) {
  if (!commit || typeof commit !== 'string' || commit.length < 7) {
    return '';
  }

  const shortCommit = commit.slice(0, 7);

  return `[\`${shortCommit}\`](https://github.com/ocavue/prosekit/commit/${commit}) `;
}

/** @type import('@changesets/types').GetDependencyReleaseLine */
async function getDependencyReleaseLine() {
  return '';
}

/** @type import('@changesets/types').ChangelogFunctions */
const functions = {
  getReleaseLine,
  getDependencyReleaseLine,
};

module.exports = functions;
