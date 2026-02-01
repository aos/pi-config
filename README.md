# pi-config

Personal configuration for [pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) coding agent.


## Pi Package (available via `pi install` or nix module)

These components are loaded by pi when this repo is installed as a package:

### Extensions

| Extension | Description |
|-----------|-------------|
| [model-agents](extensions/model-agents.ts) | Loads model-specific context files based on the active model. Configure via `.pi/model-agents.json` to map model patterns to custom agent files. |
| [permission-gate](extensions/permission-gate.ts) | Prompts for confirmation before running potentially dangerous bash commands (rm -rf, sudo, chmod/chown 777). |
| [review](extensions/review.ts) | Provides a `/review` command for code review. Supports PR review, uncommitted changes, branch comparison, and custom review instructions. |

### Skills

| Skill | Description |
|-------|-------------|
| [agent-browser](skills/agent-browser/SKILL.md) | Automates browser interactions for web testing, form filling, screenshots, and data extraction. |
| [browser-tools](skills/browser-tools/SKILL.md) | Interact with web pages via Chrome DevTools Protocol. Navigate, evaluate JS, take screenshots, pick elements, and dismiss cookie dialogs. |
| [frontend-design](skills/frontend-design/SKILL.md) | Design and implement distinctive, production-ready frontend interfaces with strong aesthetic direction. |
| [kagi-search](skills/kagi-search/SKILL.md) | Web search via Kagi. Returns search results with Quick Answers. |
| [matryoshka](skills/matryoshka/SKILL.md) | Analyze large documents (100x larger than LLM context) using recursive language model with Nucleus DSL. |

### Prompts

| Prompt | Description |
|--------|-------------|
| [handoff](prompts/handoff.md) | Creates a detailed handoff plan of the conversation for continuing work in a new session. Writes to `.plan/handoffs/`. |
| [pickup](prompts/pickup.md) | Resumes work from a previous handoff session stored in `.plan/handoffs/`. |

## Nix-only (home-manager module)

These components are only available when using the nix flake home-manager module:

### Binaries

| Package | Description |
|---------|-------------|
| `kagi-search` | CLI tool for Kagi web search |
| `browser-tools` | CLI tool for Chrome CDP automation |
| `matryoshka-rlm` | Recursive language model server for large document analysis |

### Configuration

| Config | Description |
|--------|-------------|
| `keybindings` | Custom keybindings for pi TUI |
| `model-agents.json` | Default model-to-agent mappings |
| `AGENTS.md` | Global agent behavior guidelines |

## Usage

### Nix flake

Add as an input to your flake:

```nix
inputs.pi-config = {
  url = "github:aos/pi-config";
  inputs.nixpkgs.follows = "nixpkgs";
};
```

Add the overlay to your nixpkgs:

```nix
overlays = [ inputs.pi-config.overlays.default ];
```

Import the home-manager module:

```nix
imports = [ inputs.pi-config.homeManagerModules.default ];
```

This:
- Installs `kagi-search`, `browser-tools`, and `matryoshka-rlm` binaries
- Symlinks agent configs into `~/.pi/`
- Exposes the repo as a local pi package at `~/.pi/agent/packages/pi-config`

After first deploy, add the package path to `~/.pi/agent/settings.json`:

```json
{
  "packages": ["~/.pi/agent/packages/pi-config"]
}
```

### Pi package (standalone)

Can also be installed directly via pi:

```bash
pi install git:github.com/aos/pi-config
```

This picks up extensions, skills, prompts. Binaries, keybindings, and global config files require the nix flake.
