# pi-config

Personal configuration for [pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) coding agent.

## Tools & Skills

| Tool/Skill                                | Description                                                                                               |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [chrome-cdp](chrome-cdp/)                 | Interact with local Chrome browser via Chrome DevTools Protocol. Navigate, evaluate JS, take screenshots. |
| [kagi-search](kagi-search/)               | CLI tool for Kagi web search with Quick Answers.                                                          |
| [grafana-dashboards](grafana-dashboards/) | Skill-only: create and manage Grafana dashboards via the API.                                             |
| [teaching-assistant](teaching-assistant/) | Skill-only: guided learning through explanation and feedback.                                             |

Each tool ships its skill definition under `<tool>/skill/` (installed to `$out/share/skills/<tool>/`).

## Pi Package (available via `pi install` or nix module)

These components are loaded by pi when this repo is installed as a package:

### Extensions

| Extension                                        | Description                                                                                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [custom-footer](extensions/custom-footer.ts)     | Jujutsu-aware footer showing jj bookmarks + change IDs. Falls back to git branch for non-jj repos. Displays token stats, context usage, model info, and extension statuses. |
| [model-agents](extensions/model-agents.ts)       | Loads model-specific context files based on the active model. Configure via `.pi/model-agents.json` to map model patterns to custom agent files.                            |
| [permission-gate](extensions/permission-gate.ts) | Prompts for confirmation before running potentially dangerous bash commands (rm -rf, sudo, chmod/chown 777).                                                                |
| [review](extensions/review.ts)                   | Provides a `/review` command for code review. Supports PR review, uncommitted changes, branch comparison, and custom review instructions.                                   |

### Prompts

| Prompt                        | Description                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [handoff](prompts/handoff.md) | Creates a detailed handoff plan of the conversation for continuing work in a new session. Writes to `.plan/handoffs/`. |
| [pickup](prompts/pickup.md)   | Resumes work from a previous handoff session stored in `.plan/handoffs/`.                                              |

## Installation

### Using Nix Flakes + home-manager

Add as an input to your flake:

```nix
inputs.pi-config = {
  url = "github:aos/pi-config";
  inputs.nixpkgs.follows = "nixpkgs";
};
```

Import the home-manager module:

```nix
imports = [ inputs.pi-config.homeModules.default ];

programs.pi-config.enable = true;
```

This:

- Installs `kagi-search` and `chrome-cdp` binaries
- Assembles a pi package at `~/.pi/agent/packages/pi-config` (extensions, skills, prompts)
- Symlinks agent configs (`scoped-agents`, `AGENTS.md`, `keybindings.json`, `model-agents.json`) into `~/.pi/`
- Symlinks skill definitions into `~/.claude/skills/` and `~/.opencode/skills/`

After first deploy, add the package path to `~/.pi/agent/settings.json`:

```json
{
  "packages": ["~/.pi/agent/packages/pi-config"]
}
```

### Per-skill modules

Individual skills are available as standalone home-manager modules:

```nix
imports = [
  inputs.pi-config.homeModules.kagi-search
  inputs.pi-config.homeModules.chrome-cdp
];
```

These install just the tool + skill definition, without the full pi-config extensions/prompts/global config.

### Override `skillDirs`

By default skill definitions are symlinked into `~/.claude/skills/` and `~/.opencode/skills/`. Override `programs.pi-config.skillDirs` to target different agent harnesses:

```nix
programs.pi-config.skillDirs = [ ".claude/skills" ];
```

### Pi package (standalone, no nix)

```bash
pi install git:github.com/aos/pi-config
```

This picks up extensions, skills, and prompts. Binaries, keybindings, and global config files require the nix flake.

## Development

```bash
nix develop
nix fmt
nix flake check
```

## License

MIT
