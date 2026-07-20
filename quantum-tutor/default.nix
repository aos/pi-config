{ lib, buildPythonApplication, hatchling, matplotlib, }:

buildPythonApplication {
  pname = "quantum-tutor";
  version = "0.1.0";

  src = ./.;

  pyproject = true;

  build-system = [ hatchling ];

  dependencies = [ matplotlib ];

  postInstall = ''
    mkdir -p $out/share/skills
    cp -r ${./skill} $out/share/skills/quantum-tutor
  '';

  meta = {
    description = "Socratic quantum mechanics tutor skill with inline LaTeX rendering via Ghostty/Kitty graphics protocol";
    mainProgram = "render-math";
    license = lib.licenses.mit;
    maintainers = [ ];
  };
}
