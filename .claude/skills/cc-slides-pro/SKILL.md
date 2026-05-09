---
name: cc-slides-pro
description: Generate sales-ready slide images for the Claude Code 7day Bootcamp (or any product launch) using HTML + headless Chromium rendering. No API keys, no quotas. Default 10-slide deck with one command. Trigger when the user asks for slides, sales decks, presentation images, YouTube thumbnails, or hero images for a product/course launch.
---

See `CLAUDE.md` in the project root for full instructions. Quick reference:

```bash
# initial setup (once)
cd engine && npm install && cd ..

# render the 10-slide CC bootcamp deck (default)
node engine/render-html.js --template cc-bootcamp

# style override
node engine/render-html.js --template cc-bootcamp --style anthropic

# regenerate specific slides
node engine/render-html.js --template cc-bootcamp --only 3,7

# list available layouts
node engine/render-html.js --list-layouts
```

For custom decks, follow the hearing → design json → confirm → render → refine loop in CLAUDE.md.
