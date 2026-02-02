#!/usr/bin/env bash

branch=$(git branch --show-current)
keywords="feat, fix, refactor, docs, chore, test, perf, build, ci, style"

# Pattern: type/description (e.g., feat/add-dark-mode, fix/video-playback)
pattern="^(feat|fix|build|chore|ci|docs|style|refactor|perf|test)\/[a-z0-9][a-z0-9-]*$"

# Skip check for main branch
if [ "$branch" = "main" ]; then
  exit 0
fi

if ! echo "$branch" | grep -Eq "$pattern"; then
  printf "\033[0;35mBranch name '%s' does not follow the required pattern.\033[0m\n\n" "$branch"
  printf "\033[0;35mBranch name must start with a conventional commit keyword (%s),\n" "$keywords"
  printf "followed by a slash and description in kebab-case.\033[0m\n\n"
  printf "\033[0;35mExamples:\033[0m\n"
  printf "  \033[0;35m• feat/add-dark-mode\033[0m\n"
  printf "  \033[0;35m• fix/video-playback-issue\033[0m\n"
  printf "  \033[0;35m• refactor/cleanup-main-js\033[0m\n\n"
  printf "\033[0;35mTo rename this branch: git branch -m <newname>\033[0m\n\n"
  exit 1
fi
