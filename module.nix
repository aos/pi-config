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
    browser-tools
    matryoshka-rlm
  ];

  home.file = {
    # Non-package files: agents, keybindings, model-agents, AGENTS.md
    ".pi/scoped-agents".source = "${src}/agents";
    ".pi/agent/AGENTS.md".source = "${src}/AGENTS.md";
    ".pi/agent/keybindings.json".source = "${src}/keybindings.json";
    ".pi/agent/model-agents.json".source = "${src}/model-agents.json";

    # Expose the whole repo as a local pi package
    ".pi/agent/packages/pi-config".source = src;
  };
}
