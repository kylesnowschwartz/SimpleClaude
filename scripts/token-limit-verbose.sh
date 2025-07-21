#!/bin/bash

# Script uses column -t for automatic alignment

# Formatting codes
BOLD='\033[1m'
RESET='\033[0m'

# Function to extract token data from npm output
get_token_data() {
  local temp_data
  temp_data=$(npx token-limit --config shared-simpleclaude-token-limit.config.ts --json 2>&1 | grep -A 999999 '^\[')

  # Output individual files
  echo "$temp_data" | jq -r 'sort_by(.name) | .[] |
        select(.name | test("\\(shared\\)|\\(commands\\)|\\(extras\\)")) |
        "\(.name)\t\(.tokenCount)\t\(.tokenLimit)\t$\(.cost | . * 1000 | round / 1000)"'

  # Calculate and output totals
  echo "$temp_data" | jq -r '[.[] | select(.name | test("\\(shared\\)|\\(commands\\)|\\(extras\\)"))] |
        "TOTAL\t\(map(.tokenCount) | add)\t\(map(.tokenLimit) | add)\t$\(map(.cost) | add | . * 1000 | round / 1000)"'
}

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
  # Apply clean formatting
  if [[ $line == *"File"* ]]; then
    # Header line
    echo "$line"
    echo "$(echo "$line" | sed 's/./─/g')" # Unicode horizontal line
  elif [[ $line == *"TOTAL"* ]]; then
    # Separator before total
    echo "$(echo "$line" | sed 's/./─/g')"
    # Total line in bold
    echo -e "${BOLD}$line${RESET}"
  else
    # Data line - clean output without color coding
    echo "$line"
  fi
done
