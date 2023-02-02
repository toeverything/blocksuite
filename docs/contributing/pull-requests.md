# Pull requests

## Setting up your local environment

To get stated, you will need to install `git`, `node.js` locally.

These are detailed in [BUILDING.md](../../BUILDING.md)

Once you have `git` and `node.js`.
We can start to create a fork.

### Step 1: Fork

Fork the project [on GitHub](https://github.com/toeverything/blocksuite) and clone your fork locally.

```shell
git clone https://github.com/YOU_USERNAME/blocksuite.git
cd blocksuite
git remote add upstream https://github.com/toeverything/blocksuite.git
git fetch upstream
```

Configure your email and name so that we know who you are:

```shell
git config user.name "J. Random User"
git config user.email "j.random.user@example.com"
```

## Step 2: Branch

Create a new branch once you have a new feature or a bug fix to keep you local development environment as organized as possible.

```shell
git checkout -b new-branch -t upstream/HEAD
```

## Step 3: Code

Blocksuite is a monorepo repository.
Which means there are many packages that performs different functions

- Editable blocks code contained in the `packages/blocks` directory.
- A complete BlockSuite-based editor code contained in the `packages/editor` directory
- A data store built for general-purpose state management code contained in the `packages/store` directory

Make sure you have run `pnpm exec lint-staged` after modifying code.

> As expected, `lint-staged` will be automatically executed in git hooks.
>
> See `.husky/pre-commit`

## Step 4: Commit

```shell
git add changed/files
git commit
```

### Commit message guidelines

## Step 5: Rebase

## Step 6: Test

## Step 7: Push

## Step 8: Opening the pull request

## Step 9: Discuss and keep updated

## Step 10: Landing
