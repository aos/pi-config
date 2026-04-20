# Per-skill homeModules.<name> for standalone use.
#
# Each module installs just that tool + symlinks its skill definition into
# configured skillDirs. Does NOT set up the pi package directory — use
# `homeModules.default` for full pi-config integration.
{ self, lib, ... }:
let
  registry = import ./skills.nix;

  mkBaseModule =
    pkgName:
    { pkgs, config, ... }:
    let
      pkg = self.packages.${pkgs.stdenv.hostPlatform.system}.${pkgName};
      skillDir = "${pkg}/share/skills/${pkgName}";
    in
    {
      key = "pi-config/base/${pkgName}";
      home.packages = [ pkg ];
      home.file = lib.listToAttrs (
        map (
          dir: lib.nameValuePair "${dir}/${pkgName}" { source = skillDir; }
        ) config.programs.pi-config.skillDirs
      );
    };

  mkSkillModule =
    name: def:
    let
      pkgName = def.package or name;
    in
    {
      key = "pi-config/${name}";
      imports = [
        ./home-manager-common.nix
        (mkBaseModule pkgName)
      ];
    };
in
builtins.mapAttrs mkSkillModule registry
