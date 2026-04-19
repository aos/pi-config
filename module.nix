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
in
{
  home.packages = with pkgs; [
    kagi-search
    chrome-cdp
    matryoshka-rlm
  ];

  home.file = {
    # Non-package files: agents, keybindings, model-agents, AGENTS.md
    ".pi/scoped-agents".source = "${src}/scoped-agents";
    ".pi/agent/AGENTS.md".source = "${src}/AGENTS_GLOBAL.md";
    ".pi/agent/keybindings.json".source = "${src}/keybindings.json";
    ".pi/agent/model-agents.json".source = "${src}/model-agents.json";

    # extensions, skills, prompts are packaged
    ".pi/agent/packages/pi-config".source = src;
  };
}
