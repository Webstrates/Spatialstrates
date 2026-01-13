#!/bin/bash

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/../prototypes/spatialstrate/index.html"
TARGET_FILE="$SCRIPT_DIR/spatialstrates.html"

if [ ! -f "$SOURCE_FILE" ]; then
    echo "Error: $SOURCE_FILE not found"
    exit 1
fi

# Copy the file
echo "Copying $SOURCE_FILE to $TARGET_FILE"
cp "$SOURCE_FILE" "$TARGET_FILE"

# Clean the file
echo "Cleaning file: $TARGET_FILE"
perl -0777 -pi -e '
    # Remove the entire <head> element and its contents
    s/<head[^>]*>.*?<\/head>//gs;

    # Remove <code-folder name="WPM"> element and its contents
    s/<code-folder\s+name="WPM"[^>]*>.*?<\/code-folder>//gs;

    # Remove <code-folder name="Meta Elements"> element and its contents
    s/<code-folder\s+name="Meta Elements"[^>]*>.*?<\/code-folder>//gs;

    # Remove <code-folder id="vis-component-container"> element and its contents
    s/<code-folder\s+class="dataset-container"[^>]*>.*?<\/code-folder>//gs;
    s/<code-folder\s+class="spec-container"[^>]*>.*?<\/code-folder>//gs;
    s/<code-folder\s+id="vis-component-container"[^>]*>.*?<\/code-folder>//gs;

    # Remove <code-fragment data-type="text/markdown" name="AGENTS"> element and its contents
    s/<code-fragment\s+data-type="text\/markdown"\s+name="AGENTS"[^>]*>.*?<\/code-fragment>//gs;
' "$TARGET_FILE"

echo "Output file: $TARGET_FILE"
echo "Done."
