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
  local temp_data=$(npx token-limit --config shared-simpleclaude-token-limit.config.ts --json 2>&1 | grep -A 999999 '^\[')
  
  # Output individual files
  echo "$temp_data" | jq -r 'sort_by(.name) | .[] |
        select(.name | test("\\(shared\\)|\\(commands\\)|\\(extras\\)")) |
        "\(.name)\t\(.tokenCount)\t\(.tokenLimit)\t$\(.cost | . * 1000 | round / 1000)"'
  
  # Calculate and output totals
  echo "$temp_data" | jq -r '[.[] | select(.name | test("\\(shared\\)|\\(commands\\)|\\(extras\\)"))] |
        "TOTAL\t\(map(.tokenCount) | add)\t\(map(.tokenLimit) | add)\t$\(map(.cost) | add | . * 1000 | round / 1000)"'
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

# Run token-check and parse JSON output into aligned table
echo "# Token Usage Report"
echo ""

# Create tab-separated data and use column for perfect alignment
{
  # Print header
  echo -e "File\tTokens\tLimit\tCost"
  
  # Print data
  get_token_data
} | column -t -s $'\t' | while IFS= read -r line; do
  # Apply color coding and formatting
  if [[ $line == *"File"* ]]; then
    # Header line
    echo "$line"
    echo "$(echo "$line" | sed 's/./─/g')"  # Unicode horizontal line
  elif [[ $line == *"TOTAL"* ]]; then
    # Separator before total
    echo "$(echo "$line" | sed 's/./─/g')"
    # Total line in bold
    echo -e "\033[1m$line\033[0m"
  else
    # Data line - apply green color to token numbers (all are within limits)
    tokens=$(echo "$line" | awk '{print $2}')
    limit=$(echo "$line" | awk '{print $3}')
    
    if [[ $tokens -gt $limit ]]; then
      # Red for over limit
      echo "$line" | sed "s/\b$tokens\b/${RED}$tokens${RESET}/"
    else
      # Green for within limit  
      echo "$line" | sed "s/\b$tokens\b/${GREEN}$tokens${RESET}/"
    fi
  fi
done
