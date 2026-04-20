{ pkgs }:
{
  projectRootFile = "flake.nix";
  programs.nixfmt.enable = true;
  programs.prettier.enable = true;
  programs.shellcheck.enable = true;
  programs.shfmt.enable = true;

  programs.ruff.format = true;
  programs.ruff.check = true;

  programs.mypy.enable = true;
  programs.mypy.directories = {
    "kagi-search" = {
      extraPythonPackages = with pkgs.python3.pkgs; [
        beautifulsoup4
        types-beautifulsoup4
      ];
    };
  };

  settings.global.excludes = [
    "*.lock"
    "*.toml"
    "*.png"
    "*.svg"
  ];
}
