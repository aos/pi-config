# Skill-only package — no CLI tool, just installs the skill definition.
{ runCommand }:

runCommand "grafana-dashboards" { } ''
  mkdir -p $out/share/skills
  cp -r ${./skill} $out/share/skills/grafana-dashboards
''
