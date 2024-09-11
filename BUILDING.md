# Building and Testing BlockSuite

## Using Playground

To run BlockSuite from source, please ensure you have installed [Node.js](https://nodejs.org/en/download) and [yarn](https://yarnpkg.com/).

```sh
yarn install
yarn dev
```

Be sure to use the correct version of yarn specified in package.json.

Then there would be multiple entries to choose from:

- The [localhost:5173/starter/?init](http://localhost:5173/starter/?init) entry is recommended for local debugging.
- The [localhost:5173/starter/](http://localhost:5173/starter/) entry lists all of the starter presets.
- The [localhost:5173](http://localhost:5173) entry is a comprehensive example with local-first (IndexedDB-based) data persistence and real-time collaboration support.

All these entries are published to [try-blocksuite.vercel.app](https://try-blocksuite.vercel.app).

And this would build the BlockSuite packages:

```sh
yarn build
```

## Testing

### Test Locally

Adding test cases is strongly encouraged when you contribute new features and bug fixes. We use [Playwright](https://playwright.dev/) for E2E test, and [vitest](https://vitest.dev/) for unit test.

To test locally, please make sure browser binaries are already installed via `npx playwright install`. Then there are multi commands to choose from:

```sh
# run tests in headless mode in another terminal window
yarn test

# or run tests in headed mode for debugging
yarn test -- --debug
```

In headed mode, `await page.pause()` can be used in test cases to suspend the test runner. Note that the usage of the [Playwright VSCode extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) is also highly recommended.

To test browser compatibility, the `BROWSER` environment variable can be used:

```sh
# supports `firefox|webkit|chromium`
BROWSER=firefox yarn test

# passing playwright params with the -- syntax
BROWSER=webkit yarn test -- --debug
```

To investigate flaky tests, we can mark a test case as `test.only`, then perform `npx playwright test --repeat-each=10` to reproduce the problem by repeated execution. It's also very helpful to run `yarn test -- --debug` with `await page.pause()` added before certain asserters.

### Test Collaboration

To test the real-time collaboration feature of BlockSuite locally, please follow these two simple steps:

1. Open [localhost:5173/starter/?init&room=hello](http://localhost:5173/starter/?init&room=hello) in the first browser tab.
2. Open [localhost:5173/starter/?room=hello](http://localhost:5173/starter/?room=hello) in a second tab.

See the [documentation](https://blocksuite.io/guide/data-synchronization.html#document-streaming) about what's happening under the hood.
