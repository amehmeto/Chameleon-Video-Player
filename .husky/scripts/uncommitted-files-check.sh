#!/usr/bin/env bash
set -e

if ! git diff-index --quiet HEAD --; then
  printf "\033[0;35mError: You have uncommitted changes.\033[0m\n"
  printf "\033[0;35mPlease commit or stash your changes before pushing.\033[0m\n"
  exit 1
fi
