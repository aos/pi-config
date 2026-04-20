# Default home-manager module for pi-config.
#
# Installs all CLI tools, assembles a pi package directory at
# ~/.pi/agent/packages/pi-config (with skills/ built from package outputs),
# and symlinks global config files.
{ self }:
{
  lib,
  pkgs,
  config,
  ...
}:
let
  cfg = config.programs.pi-config;

  registry = import ./skills.nix;
  allSkills = builtins.attrNames registry;
  packages = self.packages.${pkgs.stdenv.hostPlatform.system};

  # The source tree, filtered for the pi-package bits (extensions, prompts, etc.)
  src = builtins.path {
    path = ./..;
    name = "pi-config";
    filter =
      path: type:
      !builtins.elem (baseNameOf path) [
        ".git"
        ".jj"
        "flake.nix"
        "flake.lock"
        "nix"
        "result"
      ];
  };

  # Assemble the pi package directory: source tree + skills/ from package outputs.
  piPackage = pkgs.runCommand "pi-config-package" { } ''
    mkdir -p $out

    # Core pi-package files
    ln -s ${src}/package.json $out/package.json
    ln -s ${src}/extensions $out/extensions
    ln -s ${src}/prompts $out/prompts

    # Build skills/ from each package's share/skills/<name>
    mkdir -p $out/skills
    ${lib.concatMapStringsSep "\n" (
      name: "ln -s ${packages.${name}}/share/skills/${name} $out/skills/${name}"
    ) cfg.skills}
  '';
in
{
  imports = [ ./home-manager-common.nix ];

  options.programs.pi-config = {
    enable = lib.mkEnableOption "pi-config agent tools and configuration";

    skills = lib.mkOption {
      type = lib.types.listOf (lib.types.enum allSkills);
      default = allSkills;
      description = ''
        Which skills to install. Each entry installs the CLI tool (if any)
        into `home.packages` and the skill definition into the pi package
        and every directory listed in `programs.pi-config.skillDirs`.
      '';
      example = [
        "kagi-search"
        "chrome-cdp"
      ];
    };
  };

  config = lib.mkIf cfg.enable {
    home.packages = map (name: packages.${name}) cfg.skills;

    home.file = {
      # Pi package directory — pi discovers extensions, skills, and prompts from here
      ".pi/agent/packages/pi-config".source = piPackage;

      # Global agent config
      ".pi/scoped-agents".source = "${src}/scoped-agents";
      ".pi/agent/AGENTS.md".source = "${src}/AGENTS_GLOBAL.md";
      ".pi/agent/keybindings.json".source = "${src}/keybindings.json";
      ".pi/agent/model-agents.json".source = "${src}/model-agents.json";
    }
    // lib.listToAttrs (
      lib.concatMap (
        name:
        map (dir: {
          name = "${dir}/${name}";
          value.source = "${packages.${name}}/share/skills/${name}";
        }) cfg.skillDirs
      ) cfg.skills
    );
  };
}
