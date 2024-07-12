/**
 * This script converts the GitHub generated release note
 */
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PR {
  contributor: string;
  description: string;
  prNumber: number;
  type: string;
}

function analyzeReleaseNotes(filePath: string): string {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n');

  let prCount = 0;
  let newContributorCount = 0;
  const prs: PR[] = [];

  for (const line of lines) {
    // count pull requests
    if (line.startsWith('*')) {
      prCount++;
      // extract pull request info
      const prInfo = line.match(
        /\* (.*): (.*) by @(.*) in https:\/\/github.com\/toeverything\/blocksuite\/pull\/(\d+)/
      );
      if (prInfo) {
        const [, type, description, contributor, prNumber] = prInfo;
        prs.push({
          contributor,
          description,
          prNumber: Number(prNumber),
          type,
        });
      }
    }

    // count new contributors
    if (line.startsWith('* @')) {
      newContributorCount++;
    }
  }

  // sort pull requests by type
  prs.sort((a, b) => a.type.localeCompare(b.type));

  let output = '';
  for (const pr of prs) {
    output += `- ${pr.type}: ${pr.description} @${pr.contributor} (#${pr.prNumber})\n`;
  }

  const result = `This release contains ${prCount} PRs and ${newContributorCount} new contributors.\n\n${output}`;
  return result;
}

function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const inputPath = join(__dirname, 'input.md');
  const outputPath = join(__dirname, 'release-note-draft.md');

  const result = analyzeReleaseNotes(inputPath);
  fs.writeFileSync(outputPath, result, 'utf8');
}

main();
