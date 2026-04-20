## Project Structure

This repo authors **skills** and **extensions** for pi. Each skill/tool lives in its own top-level directory (e.g. `kagi-search/`, `chrome-cdp/`) with colocated source, `default.nix`, and `skill/SKILL.md`. Extensions live under `extensions/`. Nix infrastructure lives under `nix/`.

Both skills and extensions are authored here and installed onto a user's target machine — do **not** move them into `.pi/skills/` or `.pi/extensions/` within this repo.

See [README.md](README.md) for how this repo is loaded onto a target machine.
