{
  description = "Pi coding agent configuration";

  outputs = { self, ... }: {
    homeManagerModules.default = import ./module.nix;
  };
}
