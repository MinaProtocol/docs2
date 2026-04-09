#!/usr/bin/env bash
# Script to generate Mina CLI reference documentation from the mina binary.
#
# This script captures the help output of each mina command group and formats
# it as markdown suitable for the docs website (docs.minaprotocol.com).
#
# Usage:
#   ./scripts/generate-cli-reference.sh [path/to/mina] [output-dir]
#
# Arguments:
#   path/to/mina  Path to the mina executable (default: mina, assumes it's in PATH)
#   output-dir    Directory to write output files (default: /tmp/mina-cli-reference)
#
# Example:
#   ./scripts/generate-cli-reference.sh \
#     _build/default/src/app/cli/src/mina.exe \
#     /tmp/mina-cli-reference

set -euo pipefail

MINA_BIN="${1:-mina}"
OUTPUT_DIR="${2:-/tmp/mina-cli-reference}"

if ! (command -v "$MINA_BIN" &>/dev/null || [ -x "$MINA_BIN" ]); then
  echo "Error: mina binary not found at '$MINA_BIN'" >&2
  echo "Build it first with: dune build src/app/cli/src/mina.exe" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Helper function to append help text for a command
append_help() {
  local cmd="$1"
  local output_file="$2"
  local indent="${3:-}"

  # Capture the help text; use || true to handle non-zero exit from --help
  local help_output
  help_output="$("$MINA_BIN" $cmd --help 2>&1 || true)"

  printf '%s\n' "$help_output" >> "$output_file"
  printf '\n' >> "$output_file"
}

# Generate the top-level command reference
TOP_LEVEL_FILE="$OUTPUT_DIR/mina-cli-reference.md"
cat > "$TOP_LEVEL_FILE" <<'HEADER'
---
title: Mina CLI Reference
hide_title: true
description: Reference for the Mina CLI (command line interface) which is the primary way to interact with the Mina network.
keywords:
  - Mina CLI
  - create account
  - send transaction
  - reference
---

# Mina CLI Reference

The Mina CLI (Command Line Interface) is the primary way for users to interact with the Mina network. It provides standard client functionality to create accounts, send transactions, and participate in consensus. There are also advanced client and daemon commands for power users.

The Mina CLI is installed when you [install Mina](/node-operators/block-producer-node/getting-started#installation).

:::tip

Mina APIs are always improving. See `mina help` for the most up-to-date version.

:::

HEADER

echo "Generating CLI reference documentation..."

# Top-level help
echo "## mina" >> "$TOP_LEVEL_FILE"
echo '```' >> "$TOP_LEVEL_FILE"
("$MINA_BIN" --help 2>&1 || true) >> "$TOP_LEVEL_FILE"
echo '```' >> "$TOP_LEVEL_FILE"
echo "" >> "$TOP_LEVEL_FILE"

# Define the main command groups to document
declare -a CMD_GROUPS=(
  "accounts"
  "client"
  "daemon"
  "advanced"
  "ledger"
  "libp2p"
)

for group in "${CMD_GROUPS[@]}"; do
  echo "## mina $group" >> "$TOP_LEVEL_FILE"
  echo '```' >> "$TOP_LEVEL_FILE"
  ("$MINA_BIN" "$group" --help 2>&1 || true) >> "$TOP_LEVEL_FILE"
  echo '```' >> "$TOP_LEVEL_FILE"
  echo "" >> "$TOP_LEVEL_FILE"

  # Get subcommands for this group
  subcommand_output="$("$MINA_BIN" "$group" --help 2>&1 || true)"

  # Extract subcommand names from the help output
  # Lines after "=== subcommands ===" are subcommands until next section or end
  in_subcommands=false
  while IFS= read -r line; do
    if [[ "$line" == *"=== subcommands ==="* ]]; then
      in_subcommands=true
      continue
    fi
    if [[ "$in_subcommands" == true ]]; then
      if [[ "$line" == *"==="* ]]; then
        in_subcommands=false
        continue
      fi
      # Subcommand lines start with 2 spaces then a non-space char;
      # continuation/description lines have more leading whitespace.
      if [[ ! "$line" =~ ^\ \ [^\ ] ]]; then
        continue
      fi
      subcmd="$(awk '{print $1}' <<< "$line")"
      if [[ -n "$subcmd" ]]; then
        echo "### mina $group $subcmd" >> "$TOP_LEVEL_FILE"
        echo '```' >> "$TOP_LEVEL_FILE"
        ("$MINA_BIN" "$group" "$subcmd" --help 2>&1 || true) >> "$TOP_LEVEL_FILE"
        echo '```' >> "$TOP_LEVEL_FILE"
        echo "" >> "$TOP_LEVEL_FILE"
      fi
    fi
  done <<< "$subcommand_output"
done

echo "CLI reference documentation generated in: $OUTPUT_DIR"
echo "Main file: $TOP_LEVEL_FILE"
