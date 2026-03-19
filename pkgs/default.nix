final: prev: {
  kagi-search = final.python3.pkgs.callPackage ./kagi-search { };
  matryoshka-rlm = final.callPackage ./matryoshka { };
}
