{
  callPackage,
  python3,
}:
let
  pyCall = python3.pkgs.callPackage;
in
{
  chrome-cdp = callPackage ../chrome-cdp { };
  kagi-search = pyCall ../kagi-search { };
  grafana-dashboards = callPackage ../grafana-dashboards { };
  teaching-assistant = callPackage ../teaching-assistant { };
}
