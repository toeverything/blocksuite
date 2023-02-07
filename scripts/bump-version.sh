#!/bin/bash

if [ -z "$1" ]
then
  echo "$0 [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]"
  exit 1
else
  pnpm version -ws --no-git-tag-version --no-commit-hooks --no-workspaces-update --include-workspace-root $1
fi

