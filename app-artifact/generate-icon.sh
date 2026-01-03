#!/bin/bash
# DevOps Dashboard Icon Generator
# Creates all required PWA icons

echo "Generating DevOps Dashboard icons..."

# Colors in RGB format
BG_COLOR="rgb(15,23,42)"  # #0f172a dark blue background
PRIMARY_COLOR="rgb(37,99,235)"  # #2563eb primary blue
TEXT_COLOR="white"

# Icon sizes from manifest.json
SIZES="72 96 128 144 152 192 384 512"

for SIZE in $SIZES; do
    echo "Creating icon-${SIZE}.png..."
    
    # Calculate dimensions for inner elements
    BORDER=$((SIZE / 10))
    INNER_SIZE=$((SIZE - 2 * BORDER))
    
    # Create icon using ImageMagick
    convert -size ${SIZE}x${SIZE} xc:"$BG_COLOR" \
        -fill "$PRIMARY_COLOR" \
        -draw "roundrectangle $BORDER,$BORDER $((SIZE - BORDER)),$((SIZE - BORDER)) $((SIZE/20)),$((SIZE/20))" \
        -pointsize $((SIZE/3)) \
        -fill "$TEXT_COLOR" \
        -font Arial \
        -gravity center \
        -annotate 0 "DO" \
        "icon-${SIZE}.png"
    
    # Check if creation was successful
    if [ -f "icon-${SIZE}.png" ]; then
        echo "  ✓ icon-${SIZE}.png created successfully"
    else
        echo "  ✗ Failed to create icon-${SIZE}.png"
    fi
done

# Also create the main icon referenced in HTML
convert -size 192x192 xc:"$BG_COLOR" \
    -fill "$PRIMARY_COLOR" \
    -draw "roundrectangle 20,20 172,172 10,10" \
    -pointsize 64 \
    -fill "$TEXT_COLOR" \
    -font Arial \
    -gravity center \
    -annotate 0 "DO" \
    "icon-192.png"

echo ""
echo "✅ All icons generated successfully!"
echo "Icons created:"
ls -la icon-*.png
echo ""
echo "Now update your manifest.json to reference these icons."
