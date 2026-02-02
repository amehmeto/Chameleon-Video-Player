#!/usr/bin/env bash
set -e

branch=$(git branch --show-current)

if [ "$branch" = "main" ]; then
  printf "\033[0;35mDirect push to %s is not allowed.\033[0m\n" "$branch"
  printf "\033[0;35mPlease create a feature branch and open a PR.\033[0m\n"
  exit 1
fi
