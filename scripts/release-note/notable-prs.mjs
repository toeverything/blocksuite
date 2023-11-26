// Script to fetch notable PRs from a GitHub repository between a given tag and the current HEAD.
// It prompts the user for a GitHub Token and Base Tag, then fetches PR details and writes notable PRs to a file.

import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import simpleGit from 'simple-git';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const git = simpleGit();

const REPO_OWNER = 'toeverything';
const REPO_NAME = 'blocksuite';

async function getUserInput() {
  const responses = await inquirer.prompt([
    {
      name: 'githubToken',
      type: 'input',
      message: 'Enter your GitHub Token:',
    },
    {
      name: 'baseTag',
      type: 'input',
      message: 'Enter the Base Tag (e.g., v0.9.0):',
    },
  ]);
  return responses;
}

async function getCommitsFromTag(baseTag) {
  const commits = await git.log({ from: baseTag, to: 'HEAD' });
  return commits.all;
}

function extractPRNumbers(commits) {
  const prNumbers = commits
    .map(commit => commit.message.match(/\(#(\d+)\)/))
    .filter(match => match != null)
    .map(match => match[1]);
  return [...new Set(prNumbers)];
}

async function getPRsWithLabel(prNumbers, githubToken) {
  const notablePRs = [];
  for (const [index, number] of prNumbers.entries()) {
    // eslint-disable-next-line no-undef
    process.stdout.write(`Processing ${index + 1}/${prNumbers.length}...\r`);

    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${number}`,
      {
        headers: { Authorization: `Bearer ${githubToken}` },
      }
    );
    const pr = await response.json();

    if (pr.labels && pr.labels.some(label => label.name === 'notable')) {
      notablePRs.push(pr);
    }
  }
  console.log('\n'); // Move to the next line after processing is complete
  return notablePRs;
}

function writeOutput(notablePRs) {
  const outputData = notablePRs
    .map(pr => `${pr.title} (#${pr.number})`)
    .join('\n');
  fs.writeFileSync(path.join(__dirname, 'notable-output.log'), outputData);
}

async function main() {
  const { githubToken, baseTag } = await getUserInput();
  const commits = await getCommitsFromTag(baseTag);
  const prNumbers = extractPRNumbers(commits);
  const notablePRs = await getPRsWithLabel(prNumbers, githubToken);

  writeOutput(notablePRs);
}

main();
