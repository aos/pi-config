{
  description = "Pi coding agent configuration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    chrome-cdp-skill = {
      url = "github:pasky/chrome-cdp-skill";
      flake = false;
    };
  };

  outputs = { self, nixpkgs, chrome-cdp-skill, ... }: {
    overlays.default = import ./pkgs;

    homeManagerModules.default = import ./module.nix { inherit chrome-cdp-skill; };
  };
}
