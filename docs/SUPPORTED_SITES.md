# Supported Sites

Deep-Live-Cam Chrome Extension supports real-time face swapping on these platforms.

## Video Chat Sites

| Site | Status | Notes |
|------|--------|-------|
| Omegle | ✅ Tested | Works well |
| OmeTV | ✅ Tested | Works well |
| ChatRandom | ✅ Tested | Works well |
| Tinychat | ✅ Tested | Works well |
| Chaturbate | ⚠️ Partial | May vary |

## Video Conferencing

| Site | Status | Notes |
|------|--------|-------|
| Google Meet | ✅ Tested | Works well |
| Zoom | ✅ Tested | Works well |
| Microsoft Teams | ✅ Tested | Works well |

## Social/Streaming

| Site | Status | Notes |
|------|--------|-------|
| Discord | ✅ Tested | Video calls & streams |
| Twitch | ⚠️ Partial | Streamer mode only |
| YouTube Live | ⚠️ Limited | OBS recommended |

## Adding New Sites

Want to add support for a new site? Here's how:

1. Add the site to `manifest.json` host_permissions
2. Add to content_scripts matches
3. Test the injection works
4. Update this document

## Site-Specific Notes

### Omegle
- Works with text and video chat
- Best results with direct camera

### OmeTV
- Similar to Omegle
- May need to allow camera twice

### Discord
- Works in video calls
- May not work in screen share

### Google Meet
- Works in video meetings
- Best with direct video (not screen share)

## Testing New Sites

To test a new site:

1. Go to the site
2. Enable face swap in extension
3. Check if video is being processed
4. Look for face swap overlay

## Known Limitations

- Some sites may block content scripts
- HTTPS required for most sites
- Some enterprise sites may restrict extensions
