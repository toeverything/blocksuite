/**
 * This script validates all pull requests are included in the release note
 */
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

function getPullRequestNumbers(filePath: string) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const matches = fileContent.match(/pull\/(\d+)/g);
  const prNumbers: string[] = [];
  if (matches) {
    for (const match of matches) {
      prNumbers.push(match.replace('pull/', ''));
    }
  }
  return prNumbers;
}

function checkPullRequestNumbers(text: string, prNumbers: string[]): boolean {
  const missing: string[] = [];

  for (const prNumber of prNumbers) {
    const regex = new RegExp(`#${prNumber}`, 'g');
    if (!regex.test(text)) {
      missing.push(prNumber);
    }
  }

  if (missing.length > 0) {
    console.log('Missing PRs:', missing);
  }
  return missing.length === 0;
}

function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const rawPath = join(__dirname, 'input.md');
  const draftPath = join(__dirname, 'release-note.md');
  const draftContent = fs.readFileSync(draftPath, 'utf8');

  const prNumbers = getPullRequestNumbers(rawPath);
  console.log('Validate:', checkPullRequestNumbers(draftContent, prNumbers));
}

main();
