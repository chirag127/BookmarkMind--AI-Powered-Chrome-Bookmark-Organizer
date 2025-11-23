#!/usr/bin/env python3
"""
Simple script to create BookmarkMind extension icons
Creates PNG icons in different sizes from SVG-like design
"""

try:
    from PIL import Image, ImageDraw
    import os
except ImportError:
    print("PIL (Pillow) not available. Creating placeholder icons...")
    # Create simple placeholder files
    sizes = [16, 48, 128]
    for size in sizes:
        with open(f'icon{size}.png', 'w') as f:
            f.write(f'# Placeholder icon {size}x{size}\n# Replace with actual PNG icon')
    exit()

def create_bookmark_icon(size):
    """Create a bookmark-style icon"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Calculate dimensions
    margin = size // 8
    width = size - 2 * margin
    height = size - 2 * margin

    # Main bookmark shape (rounded rectangle)
    bookmark_color = (26, 115, 232)  # Google Blue
    draw.rounded_rectangle(
        [margin, margin, margin + width, margin + height],
        radius=size // 16,
        fill=bookmark_color
    )

    # Add bookmark "fold" at top right
    fold_size = size // 6
    fold_points = [
        (margin + width - fold_size, margin),
        (margin + width, margin),
        (margin + width, margin + fold_size),
    ]
    draw.polygon(fold_points, fill=(255, 255, 255, 100))

    # Add lines to represent text
    line_color = (255, 255, 255, 200)
    line_width = max(1, size // 32)
    line_margin = margin + size // 8
    line_spacing = size // 8

    for i in range(3):
        y = margin + size // 4 + i * line_spacing
        line_end = margin + width - size // 6 if i == 2 else margin + width - size // 8
        draw.rectangle(
            [line_margin, y, line_end, y + line_width],
            fill=line_color
        )

    return img

def main():
    """Create icons in different sizes"""
    sizes = [16, 48, 128]

    for size in sizes:
        icon = create_bookmark_icon(size)
        filename = f'icon{size}.png'
        icon.save(filename, 'PNG')
        print(f'Created {filename}')

if __name__ == '__main__':
    main()