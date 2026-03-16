#!/usr/bin/env bash

SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"

cd $SCRIPT_DIR/..

function usage() {
    local errmsg="$1"
    if [[ -n "$errmsg" ]]; then
        echo "Error: $errmsg"
        echo
    fi
    cat << EOF
Usage: ${0##*/} [--devnet-tag <new_devnet_tag>] [--mainnet-tag <new_mainnet_tag>]
  --mainnet-tag       The new mainnet tag to use
  --devnet-tag        The new devnet tag to use
  --mainnet-commit    The new mainnet commit to use
  --devnet-commit     The new devnet commit to use

This script takes old release info, scan through the whole repo and replace old
tags them with provided new tags.
EOF
    exit 1
}

HAS_WORK=0

while [[ "$#" -gt 0 ]]; do case $1 in
  --mainnet-tag) NEW_MAINNET_TAG="$2"; HAS_WORK=1; shift;;
  --devnet-tag) NEW_DEVNET_TAG="$2"; HAS_WORK=1; shift;;
  --mainnet-commit) NEW_MAINNET_COMMIT="$2"; HAS_WORK=1; shift;;
  --devnet-commit) NEW_DEVNET_COMMIT="$2"; HAS_WORK=1; shift;;
  *) usage "Unknown parameter passed: $1";;
esac; shift; done

if [[ "$HAS_WORK" -eq 0 ]]; then
  usage "Nothing to update."
fi

process_update() {
  local json_key="$1"
  local new_value="$2"

  if [ -z "$new_value" ]; then
    return 0
  fi

  local old_value
  old_value=$(jq -r "$json_key" metadata.json)

  if [ -z "$old_value" ]; then
    echo "Failed to read $json_key from metadata.json"
    exit 1
  fi

  echo "  $json_key: $old_value → $new_value"

  escaped_old_value=$(printf '%s\n' "$old_value" | sed 's/[\/&]/\\&/g')
  escaped_new_value=$(printf '%s\n' "$new_value" | sed 's/[\/&]/\\&/g')

  grep -rl --exclude-dir=.git "$old_value" . | while read -r file; do
    sed -i "s/$escaped_old_value/$escaped_new_value/g" "$file"
  done
}

echo "Replacing release tags"

process_update '.release.tags.mainnet' "$NEW_MAINNET_TAG"
process_update '.release.tags.devnet' "$NEW_DEVNET_TAG"
process_update '.release.commits.mainnet' "$NEW_MAINNET_COMMIT"
process_update '.release.commits.devnet' "$NEW_DEVNET_COMMIT"

echo "Replacement complete, please check if there's any false positives"
