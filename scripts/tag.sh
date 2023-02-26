#!/bin/bash

VERSION=$(node -p "require('./package.json').version")
git tag $VERSION
git push --tags
