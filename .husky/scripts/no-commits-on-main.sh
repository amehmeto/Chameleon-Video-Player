#!/usr/bin/env bash

branch=$(git branch --show-current)

if [ "$branch" = "main" ]; then
  printf "\033[0;35mError: Direct commits to the %s branch are not allowed.\033[0m\n" "$branch"
  printf "\033[0;35mPlease create a feature branch first.\033[0m\n"
  exit 1
fi
