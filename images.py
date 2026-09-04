#!/usr/bin/env python3
"""
Growth Cream - PWA Icon Generator
Generates all required PWA icons using Pillow (PIL)
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

def create_growth_cream_icon(size):
    """
    Create a Growth Cream icon with the specified size.
    Uses a dark background with neon pink spark/growth symbol.
    """
    # Create image with dark background
    img = Image.new('RGBA', (size, size), (11, 6, 16, 255))  # #0b0610
    
    # Create drawing context
    draw = ImageDraw.Draw(img)
    
    # Define colors
    pink = (255, 43, 214, 255)  # #ff2bd6
    pink_light = (255, 114, 231, 255)  # #ff72e7
    pink_dark = (201, 0, 168, 255)  # #c900a8
    
    # Calculate proportions
    center = size // 2
    radius = int(size * 0.35)
    
    # Draw gradient circle (approximated with concentric circles)
    for i in range(radius, 0, -1):
        # Interpolate color from dark to light
        ratio = i / radius
        r = int(pink_dark[0] + (pink[0] - pink_dark[0]) * ratio)
        g = int(pink_dark[1] + (pink[1] - pink_dark[1]) * ratio)
        b = int(pink_dark[2] + (pink[2] - pink_dark[2]) * ratio)
        color = (r, g, b, 255)
        
        # Draw circle
        bbox = [center - i, center - i, center + i, center + i]
        draw.ellipse(bbox, fill=color)
    
    # Draw spark/growth symbol (✦)
    spark_radius = int(size * 0.15)
    num_sparks = 8
    spark_length = int(size * 0.3)
    
    for i in range(num_sparks):
        angle = (i * 2 * math.pi) / num_sparks
        x1 = center + int(spark_radius * math.cos(angle))
        y1 = center + int(spark_radius * math.sin(angle))
        x2 = center + int(spark_length * math.cos(angle))
        y2 = center + int(spark_length * math.sin(angle))
        
        # Draw spark line
        draw.line([x1, y1, x2, y2], fill=pink_light, width=max(2, size // 32))
        
        # Draw small dots at spark ends
        dot_radius = max(3, size // 20)
        draw.ellipse([x2 - dot_radius, y2 - dot_radius, 
                     x2 + dot_radius, y2 + dot_radius], 
                     fill=pink_light)
    
    # Draw center dot
    center_dot = max(4, size // 16)
    draw.ellipse([center - center_dot, center - center_dot,
                 center + center_dot, center + center_dot],
                 fill=pink_light)
    
    # Add subtle gradient border
    border_width = max(2, size // 64)
    for i in range(border_width):
        alpha = int(255 * (1 - i / border_width))
        color = (255, 43, 214, alpha // 4)  # Subtle pink border
        bbox = [i, i, size - 1 - i, size - 1 - i]
        draw.ellipse(bbox, outline=color, width=1)
    
    return img

def create_maskable_icon(size):
    """
    Create maskable icon with safe zone padding.
    The important content is within 80% of the icon size.
    """
    # Create base image
    img = Image.new('RGBA', (size, size), (11, 6, 16, 255))
    draw = ImageDraw.Draw(img)
    
    # Define colors
    pink = (255, 43, 214, 255)
    pink_light = (255, 114, 231, 255)
    
    # Safe zone (80% of size)
    safe_size = int(size * 0.8)
    padding = (size - safe_size) // 2
    center = size // 2
    
    # Draw background circle
    circle_radius = int(safe_size * 0.45)
    for i in range(circle_radius, 0, -1):
        ratio = i / circle_radius
        r = int(201 + (255 - 201) * ratio)
        g = int(0 + (43 - 0) * ratio)
        b = int(168 + (214 - 168) * ratio)
        color = (r, g, b, 255)
        bbox = [center - i, center - i, center + i, center + i]
        draw.ellipse(bbox, fill=color)
    
    # Draw spark symbol
    spark_radius = int(safe_size * 0.15)
    spark_length = int(safe_size * 0.35)
    num_sparks = 6
    
    for i in range(num_sparks):
        angle = (i * 2 * math.pi) / num_sparks
        x1 = center + int(spark_radius * math.cos(angle))
        y1 = center + int(spark_radius * math.sin(angle))
        x2 = center + int(spark_length * math.cos(angle))
        y2 = center + int(spark_length * math.sin(angle))
        
        draw.line([x1, y1, x2, y2], fill=pink_light, 
                 width=max(3, size // 24))
        
        dot_radius = max(4, size // 16)
        draw.ellipse([x2 - dot_radius, y2 - dot_radius,
                     x2 + dot_radius, y2 + dot_radius],
                     fill=pink_light)
    
    return img

def create_favicon(size=32):
    """
    Create favicon.ico (32x32 ICO file)
    """
    # Create simple icon for favicon
    img = Image.new('RGBA', (size, size), (11, 6, 16, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw simple growth symbol
    pink = (255, 43, 214, 255)
    center = size // 2
    
    # Draw upward arrow/growth symbol
    draw.line([center, size - 4, center, 4], fill=pink, width=3)
    draw.line([center, 4, center - 4, 10], fill=pink, width=2)
    draw.line([center, 4, center + 4, 10], fill=pink, width=2)
    
    return img

def generate_icons():
    """
    Generate all required PWA icons
    """
    # Define icon sizes
    icon_sizes = [72, 96, 128, 144, 192, 384, 512]
    
    # Create directories
    os.makedirs('assets/icons', exist_ok=True)
    
    # Generate regular icons
    for size in icon_sizes:
        print(f"Generating icon-{size}.png...")
        icon = create_growth_cream_icon(size)
        icon.save(f'assets/icons/icon-{size}.png', 'PNG')
        
        # Also create maskable version
        if size in [192, 512]:
            maskable = create_maskable_icon(size)
            maskable.save(f'assets/icons/icon-{size}-maskable.png', 'PNG')
    
    # Generate favicon
    print("Generating favicon.ico...")
    favicon = create_favicon(32)
    favicon.save('favicon.ico', 'ICO', sizes=[(32, 32)])
    
    # Generate Apple touch icon (180x180)
    print("Generating apple-touch-icon.png...")
    apple_icon = create_growth_cream_icon(180)
    apple_icon.save('assets/icons/apple-touch-icon.png', 'PNG')
    
    # Generate OG image (for social sharing)
    print("Generating og-image.png...")
    og_image = create_growth_cream_icon(1200)
    og_image.save('assets/icons/og-image.png', 'PNG')
    
    print("\n✅ All icons generated successfully!")
    print("\nGenerated files:")
    print("├── favicon.ico")
    print("└── assets/icons/")
    for size in icon_sizes:
        print(f"    ├── icon-{size}.png")
    print("    ├── icon-192-maskable.png")
    print("    ├── icon-512-maskable.png")
    print("    ├── apple-touch-icon.png")
    print("    └── og-image.png")

def create_preview_image():
    """
    Create a preview/hero image for the app (optional)
    """
    width, height = 1200, 630
    img = Image.new('RGBA', (width, height), (11, 6, 16, 255))
    draw = ImageDraw.Draw(img)
    
    # Colors
    pink = (255, 43, 214, 255)
    pink_light = (255, 114, 231, 255)
    
    # Draw sparkles
    import random
    random.seed(42)
    for _ in range(50):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(5, 20)
        opacity = random.randint(50, 200)
        color = (*pink[:3], opacity)
        draw.ellipse([x - size, y - size, x + size, y + size], fill=color)
    
    # Draw main circle in center
    center_x, center_y = width // 2, height // 2
    radius = 200
    for i in range(radius, 0, -1):
        ratio = i / radius
        r = int(201 + (255 - 201) * ratio)
        g = int(0 + (43 - 0) * ratio)
        b = int(168 + (214 - 168) * ratio)
        color = (r, g, b, 255)
        bbox = [center_x - i, center_y - i, center_x + i, center_y + i]
        draw.ellipse(bbox, fill=color)
    
    img.save('assets/icons/preview.png', 'PNG')
    print("Preview image generated: assets/icons/preview.png")

if __name__ == '__main__':
    print("🌟 Growth Cream Icon Generator")
    print("=" * 40)
    
    try:
        generate_icons()
        
        # Optional: Generate preview image
        response = input("\nGenerate preview image too? (y/n): ")
        if response.lower() == 'y':
            create_preview_image()
        
        print("\n✨ Done! Icons are ready to use.")
    except Exception as e:
        print(f"\n❌ Error generating icons: {e}")
        print("Make sure Pillow is installed:")
        print("pip install Pillow")