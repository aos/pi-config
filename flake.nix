{
  description = "Pi coding agent configuration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, ... }: {
    overlays.default = import ./pkgs;

    homeManagerModules.default = import ./module.nix;
  };
}
