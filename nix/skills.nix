# Registry of every skill/tool shipped by pi-config.
#
# Consumed by `home-manager.nix` (legacy `programs.pi-config` option module)
# and `home-modules.nix` (per-skill `homeModules.<name>`). Adding a new skill
# means adding one entry here plus a top-level `<name>/` directory containing
# `default.nix` (which must install its skill to `$out/share/skills/<name>/`).
#
# Fields (all optional):
#   package – package attr name from `self.packages.<system>` to install
#             (default: <name>).
{
  chrome-cdp = { };
  kagi-search = { };
  grafana-dashboards = { };
  teaching-assistant = { };
}
