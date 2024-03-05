#!/bin/bash

if [ -z "$1" ]
then
  echo "Please specify a project name."
  exit 1
fi

PROJECT_NAME=$1

pnpm -C "./$PROJECT_NAME" dev
