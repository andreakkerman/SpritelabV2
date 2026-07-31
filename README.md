# SpriteLab V2

A static, preview-first animation workbench for the authentic Atlas Sven walk cycle. Open `index.html` through a local HTTP server; no backend or runtime package downloads are required.

```bash
python3 -m pip install -r requirements.txt
bash tools/setup_atlas_assets.sh
python3 tools/analyze_sven.py
npm ci
npm test
```

The setup script downloads all 24 authentic frames directly from Atlas commit
`7be9f991aad0deda5b1b873c39bda3ba155ee01d`. Downloaded PNGs, generated GIF/WebP
previews, and Playwright screenshots are deliberately ignored by Git. CI performs
the same pinned setup, regenerates the binary products, tests the complete site,
and includes them in the Pages deployment artifact.

The Pages deployment target is <https://andreakkerman.github.io/SpritelabV2/>. The application uses relative URLs, so both root-local development and the `/SpritelabV2/` project base path work without rewriting.
