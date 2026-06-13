# diva-render

SVG-to-PNG render service for `diva.` PNL cards.

Triggered via GitHub Actions `workflow_dispatch` API. Renders any SVG (with embedded `@font-face` base64 fonts) to PNG using headless Chromium, then uploads the result to Cloudflare R2.

## Why

CF Pages Functions free tier blocks 2-4K renders (10ms CPU limit). Local `resvg` on VPS doesn't support `@font-face`. This gives us 4K renders with proper font rendering, 100% free, public repo = unlimited minutes.

## Inputs

| Input     | Required | Default | Description                                |
|-----------|----------|---------|--------------------------------------------|
| `svg_url` | yes      | —       | Public URL of the SVG to render            |
| `png_path`| yes      | —       | R2 key for output (e.g. `worldcups/v4.png`)|
| `width`   | no       | 1366    | Output width in pixels                    |
| `height`  | no       | 768     | Output height in pixels                   |

## Required Secrets

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

## Trigger from CLI

```bash
gh workflow run render.yml \
  -f svg_url=https://pub-XXXXX.r2.dev/worldcups.svg \
  -f png_path=worldcups/v4.png \
  -f width=1366 \
  -f height=768
```

## End-to-end timing

- Cold (first run, fresh deps): 60-90s
- Warm (deps cached): 30-45s
