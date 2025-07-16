#!/bin/bash

# Column width configuration
FILE_WIDTH=25
TOKENS_WIDTH=6
LIMIT_WIDTH=6
COST_WIDTH=8

# Calculate separator widths (includes spaces and pipes)
FILE_SEP_WIDTH=$((FILE_WIDTH + 2))
TOKENS_SEP_WIDTH=$((TOKENS_WIDTH + 2))
LIMIT_SEP_WIDTH=$((LIMIT_WIDTH + 2))
COST_SEP_WIDTH=$((COST_WIDTH + 2))

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

# Function to extract token data from npm output
get_token_data() {
  npm run token-check-verbose 2>/dev/null | grep -A 999999 '^\[' | jq -r 'sort_by(.files[0] | split("/") | .[-1]) | .[] |
        .files[0] as $file |
        "\($file | split("/") | .[-1])\t\(.tokenCount)\t\(.tokenLimit)\t$\(.cost | . * 1000 | round / 1000)"'
}

# AWK configuration
FIELD_SEPARATOR='\t'
AWK_SCRIPT='{
    if (NR <= 2) {
        print $0
    } else {
        # Check if tokens exceed limit
        tokens = int($2)
        limit = int($3)
        cost = $4

        # Remove $ sign and convert to number for totaling
        gsub(/\$/, "", cost)
        cost_num = cost + 0

        # Track totals
        total_tokens += tokens
        total_limit += limit
        total_cost += cost_num

        if (tokens > limit) {
            # Red for over limit
            token_color = red
        } else {
            # Green for within limit
            token_color = green
        }

        printf "| %-25s | %s%6s%s | %6s | %8s |\n", $1, token_color, $2, reset, $3, $4
    }
}
END {
    if (total_tokens > 0) {
        # Print separator matching the header separator format
        printf "|%s|%s|%s|%s|\n", \
            "---------------------------", \
            "--------", \
            "--------", \
            "----------"

        # Format total cost with $ sign, matching the other rows
        printf "| %-25s | %6d | %6d | %8s |\n", "TOTAL", total_tokens, total_limit, "$" sprintf("%.3f", total_cost)
    }
}'

# Run token-check-verbose and parse JSON output into markdown table
echo "# Token Usage Report"
echo ""

# Parse the JSON output using jq, skipping npm output lines
{
  # Print header
  printf "| %-25s | %6s | %6s | %8s |\n" "File" "Tokens" "Limit" "Cost"
  printf "|%s|%s|%s|%s|\n" \
    "$(printf '%*s' $FILE_SEP_WIDTH '' | tr ' ' '-')" \
    "$(printf '%*s' $TOKENS_SEP_WIDTH '' | tr ' ' '-')" \
    "$(printf '%*s' $LIMIT_SEP_WIDTH '' | tr ' ' '-')" \
    "$(printf '%*s' $COST_SEP_WIDTH '' | tr ' ' '-')"

  # Print data
  get_token_data
} | awk -F"$FIELD_SEPARATOR" -v green="$GREEN" -v red="$RED" -v reset="$RESET" "$AWK_SCRIPT"
