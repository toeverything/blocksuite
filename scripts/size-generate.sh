#!/bin/bash

set -eu -o pipefail

rm -fr ./temp/size
pnpm run build:editor
pnpm run size:data
pnpm -C ./packages/playground run build:size
pnpm run --silent size:report >./size-report.md
cat ./size-report.md
