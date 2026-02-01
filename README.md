# pi-config

Personal configuration for [pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) coding agent.

## What's included

- **Extensions**: model-agents, permission-gate
- **Skills**: agent-browser, browser-tools, frontend-design, kagi-search, matryoshka
- **Prompts**: handoff, pickup
- **Agents**: claude, default, kimi, openai
- **Other**: keybindings, model-agents config, AGENTS.md

## Usage

### Nix flake

Add as an input to your flake:

```nix
inputs.pi-config.url = "github:aos/pi-config";
```

Import the home-manager module:

```nix
imports = [ inputs.pi-config.homeManagerModules.default ];
```

This symlinks agent configs into `~/.pi/` and exposes the repo as a local pi package at `~/.pi/agent/packages/pi-config`.

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

This only picks up extensions, skills, and prompts. Agent configs and keybindings require the home-manager module.
