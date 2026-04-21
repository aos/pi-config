{
  callPackage,
  python3,
}:

{
  chrome-cdp = callPackage ../chrome-cdp { };
  kagi-search = python3.pkgs.callPackage ../kagi-search { };
  grafana-dashboards = callPackage ../grafana-dashboards { };
  teaching-assistant = callPackage ../teaching-assistant { };
}
