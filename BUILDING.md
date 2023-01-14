# Building BlockSuite

## Table of contents

- [Prerequisites](#prerequisites)
- [Setup Environment](#setup-environment)
- [Play with Playground](#play-with-playground)
- [Build Packages](#build-packages)
- [Debug using E2E/Unit Test](#debug-using-e2eunit-test)

## Prerequisites

We suggest develop our product under node.js LTS(Long-term support) version

### Option 1: Manual install node.js

install [Node LTS version](https://nodejs.org/en/download)

> Up to now, the major node.js version is 18.x

### Option 2: Use node version manager

install [nvm](https://github.com/nvm-sh/nvm)

```shell
nvm install --lts
nvm use --lts
```

## Setup Environment

```shell
# to enable built-in pnpm support
corepack enable
# install dependencies
pnpm install
```

## Play with Playground

```shell
pnpm run dev
```

The playground page should work at [http://localhost:5173/?init](http://localhost:5173/?init)

## Build Packages

```shell
pnpm run build
```

## Debug using E2E/Unit Test

When you contribute new features and bug fixes, the test cases are encouraged and most time are required.

We use [Playwright](https://playwright.dev/) for E2E test, and [vitest](https://vitest.dev/) for unit test.

To test locally, please make sure browser binaries are already installed via `npx playwright install` and Vite playground is started with `pnpm dev`. Then there are multi commands to choose from:

```bash
# run tests in headless mode in another terminal window
pnpm test

# or run tests in headed mode for debugging
pnpm test:headed
```

In headed mode, `await page.pause()` can be used in test cases to suspend the test runner. Note that the usage of the [Playwright VSCode extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) is also highly recommended.
