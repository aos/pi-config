# Shared option module imported by every per-skill homeModule and the default
# home-manager module. Configures which agent harnesses get skill definitions
# symlinked into their skill directories.
{ lib, ... }:
{
  key = "pi-config/common";

  options.programs.pi-config = {
    skillDirs = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [
        ".claude/skills"
        ".opencode/skills"
      ];
      example = [ ".claude/skills" ];
      description = ''
        Directories (relative to `$HOME`) into which each enabled skill's
        definition is symlinked as `<dir>/<skill>/`. One entry per agent
        harness that should discover the skills.

        Pi discovers skills via the pi package symlink at
        `~/.pi/agent/packages/pi-config`, not these directories.
      '';
    };
  };
}
