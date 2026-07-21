# Chrome Extension Icons

This directory should contain the following icon files for the Chrome Extension:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)
- `icon256.png` - 256x256 pixels (high DPI displays)

You can use any image editing tool to create these icons, or generate them from the SVG file:

```bash
# Using ImageMagick
convert -background none icon16.svg -resize 16x16 icon16.png
convert -background none icon16.svg -resize 48x48 icon48.png
convert -background none icon16.svg -resize 128x128 icon128.png
convert -background none icon16.svg -resize 256x256 icon256.png
```

The icons should feature a face swap theme with the Deep-Live-Cam branding colors (#4285f4 gradient).
