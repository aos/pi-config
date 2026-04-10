{ chrome-cdp-skill }:

{ lib, pkgs, ... }:

let
  src = builtins.path {
    path = ./.;
    name = "pi-config";
    filter =
      path: type:
      ! builtins.elem (baseNameOf path) [
        ".git"
        ".jj"
        "flake.nix"
        "flake.lock"
        "module.nix"
        "pkgs"
      ];
  };

  # Patch the upstream chrome-cdp skill to spawn Chrome when no CDP is available
  chrome-cdp-patched = pkgs.applyPatches {
    name = "chrome-cdp-skill-patched";
    src = chrome-cdp-skill;
    patches = [
      ./pkgs/chrome-cdp-skill/spawn-chrome-fallback.patch
      ./pkgs/chrome-cdp-skill/discoverability.patch
    ];
  };

  # Merge repo source with external skills into a single pi package
  pi-config-pkg = pkgs.runCommand "pi-config-pkg" { } ''
    cp -r ${src} $out
    chmod -R +w $out/skills
    cp -r ${chrome-cdp-patched}/skills/chrome-cdp $out/skills/chrome-cdp
  '';
in
{
  home.packages = with pkgs; [
    kagi-search
    matryoshka-rlm
    nodejs # needed by chrome-cdp skill's cdp.mjs
  ];

  home.file = {
    # Non-package files: agents, keybindings, model-agents, AGENTS.md
    ".pi/scoped-agents".source = "${src}/scoped-agents";
    ".pi/agent/AGENTS.md".source = "${src}/AGENTS_GLOBAL.md";
    ".pi/agent/keybindings.json".source = "${src}/keybindings.json";
    ".pi/agent/model-agents.json".source = "${src}/model-agents.json";

    # extensions, skills, prompts are packaged
    # Includes external skills merged in (chrome-cdp)
    ".pi/agent/packages/pi-config".source = pi-config-pkg;
  };
}
