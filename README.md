# BlockSuite

<a href="./package.json">
  <img src="https://img.shields.io/npm/v/@blocksuite/store.svg?maxAge=300&color=6880ff"/>
</a>

BlockSuite is a collaborative editing framework designed to reliably reconcile any Web content.

> ⚠️ This project is under heavy development and is in a stage of rapid evolution. Stay tuned!

## Introduction

WIP

## Development

Setting up basic local environment:

```bash
# install dependencies
pnpm i

# start vite playground
pnpm dev
```

To test locally, please make sure browser binaries are already installed via `npx playwright install` and Vite playground is started with `pnpm dev`. Then there are multi commands to choose from:

```bash
# run tests in headless mode in another terminal window
pnpm test

# or run tests in headed mode for debugging
pnpm test:headed
```

In headed mode, `await page.pause()` can be used in test cases to suspend the test runner.

## License

[MPL 2.0](./LICENSE)
