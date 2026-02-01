# pi-config

Personal configuration for [pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) coding agent.

## What's included

- **Extensions**: model-agents, permission-gate
- **Skills**: agent-browser, browser-tools, frontend-design, kagi-search, matryoshka
- **Prompts**: handoff, pickup
- **Agents**: claude, default, kimi, openai
- **Packages**: kagi-search, browser-tools, matryoshka-rlm (nix overlay)
- **Other**: keybindings, model-agents config, AGENTS.md

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

This only picks up extensions, skills, and prompts. Agent configs, keybindings, and binaries require the nix flake.
