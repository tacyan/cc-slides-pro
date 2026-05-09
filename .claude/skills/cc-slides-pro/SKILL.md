---
name: cc-slides-pro
description: Generate sales-ready slide decks (PNG + editable PPTX) for the Claude Code 7day Bootcamp or any product launch. Local rendering, no API keys, no quotas, unlimited slide count. Trigger when the user asks for slides, sales decks, presentation images, PowerPoint files, YouTube thumbnails, or hero images for a product/course launch.
---

See `CLAUDE.md` in the project root for full instructions. Quick reference:

```bash
# initial setup (once)
cd engine && npm install && cd ..

# render the 10-slide CC bootcamp deck (PNG + PPTX, default)
node engine/render.js --template cc-bootcamp

# 13-slide extended deck (proves >10 support)
node engine/render.js --template cc-bootcamp-extended

# format selection
node engine/render.js --template cc-bootcamp --format png      # PNG only
node engine/render.js --template cc-bootcamp --format pptx     # PPTX only

# style override
node engine/render.js --template cc-bootcamp --style anthropic

# regenerate specific PNG slides (PPTX always full deck)
node engine/render.js --template cc-bootcamp --only 3,7 --format png

# list available layouts
node engine/render.js --list-layouts
```

PPTX output is **fully editable** in PowerPoint / Keynote / Google Slides — every text element is a native text box, not an image.

For custom decks, follow the hearing → design json → confirm → render → refine loop in CLAUDE.md.
