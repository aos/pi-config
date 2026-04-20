# Skill-only package — no CLI tool, just installs the skill definition.
{ runCommand }:

runCommand "teaching-assistant" { } ''
  mkdir -p $out/share/skills
  cp -r ${./skill} $out/share/skills/teaching-assistant
''
