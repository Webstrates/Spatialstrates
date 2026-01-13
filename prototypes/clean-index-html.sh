#!/bin/bash

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_FILE="$SCRIPT_DIR/spatialstrate/index.html"
BACKUP_FILE="$SCRIPT_DIR/spatialstrate/index.html.bak"

if [ ! -f "$TARGET_FILE" ]; then
    echo "Error: $TARGET_FILE not found"
    exit 1
fi

# Create backup
echo "Creating backup: $BACKUP_FILE"
cp "$TARGET_FILE" "$BACKUP_FILE"

# Clean the file
echo "Cleaning file: $TARGET_FILE"
perl -0777 -pi -e '
    # Convert all tag names to lowercase (only actual HTML tags, not text content)
    # Match tags followed by whitespace, >, or /> to ensure they are real tags
    s/<(\/?[A-Za-z][A-Za-z0-9-]*)(\s|>|\/\s*>)/"<" . lc($1) . $2/eg;

    # Remove data-auth and __wid attributes
    s/\sdata-auth(?:\s*=\s*(?:"[^"]*"|'\''[^'\'']*'\''|[^\s>]+))?//g;
    s/\s__wid(?:\s*=\s*(?:"[^"]*"|'\''[^'\'']*'\''|[^\s>]+))?//g;

    # Empty varv-data element
    s/(<varv-data[^>]*>).*?(<\/varv-data>)/$1$2/gs;

    # Empty dataset- and spec-container element
    s/(<[^>]*class="[^"]*dataset-container[^"]*"[^>]*>).*?(<\/[^>]+>)/$1$2/gs;
    s/(<[^>]*class="[^"]*spec-container[^"]*"[^>]*>).*?(<\/[^>]+>)/$1$2/gs;

    # Remove empty id, name, and class attributes
    s/(<[^>]*)\sid\s*=\s*(?:""|'\'''\''|\s+)([^>]*>)/$1$2/g;
    s/(<[^>]*)\sname\s*=\s*(?:""|'\'''\''|\s+)([^>]*>)/$1$2/g;
    s/(<[^>]*)\sclass\s*=\s*(?:""|'\'''\''|\s+)([^>]*>)/$1$2/g;

    # Remove standalone id, name, and class attributes with no value
    s/(<[^>]*)\sid\b(?!\s*=)([^>]*>)/$1$2/g;
    s/(<[^>]*)\sname\b(?!\s*=)([^>]*>)/$1$2/g;
    s/(<[^>]*)\sclass\b(?!\s*=)([^>]*>)/$1$2/g;

    # Change the title tag content to "Spatialstrates"
    s|<title>.*?</title>|<title>Spatialstrates</title>|s;

    # Sort attributes alphabetically within each tag
    s/<([a-z][a-z0-9-]*)((?:\s+[^>]*?)?)(\s*\/?)>/
        my $tag = $1;
        my $attrs = $2;
        my $close = $3;
        my @attr_list;
        # Extract all attributes (name="value", name='\''value'\'', name=value, or standalone name)
        while ($attrs =~ m{\s+([a-z][a-z0-9-]*)(?:=(?:"([^"]*)"|'\''([^'\'']*)'\''|([^\s>]+)))?}gi) {
            my $name = lc($1);
            my $val = defined $2 ? $2 : (defined $3 ? $3 : $4);
            if (defined $val) {
                push @attr_list, [$name, qq{$name="$val"}];
            } else {
                push @attr_list, [$name, $name];
            }
        }
        my @sorted = sort { $a->[0] cmp $b->[0] } @attr_list;
        my $sorted_attrs = join(" ", map { $_->[1] } @sorted);
        $sorted_attrs = " " . $sorted_attrs if $sorted_attrs;
        "<$tag$sorted_attrs$close>";
    /egsx;
' "$TARGET_FILE"

echo "Done."
