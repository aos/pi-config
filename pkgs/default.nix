final: prev: {
  kagi-search = final.python3.pkgs.callPackage ./kagi-search { };
  chrome-cdp = final.callPackage ./chrome-cdp { };
  matryoshka-rlm = final.callPackage ./matryoshka { };
}
