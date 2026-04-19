{
  runCommand,
  makeWrapper,
  nodejs_22,
}:

runCommand "chrome-cdp" {
  nativeBuildInputs = [ makeWrapper ];
  meta = {
    description = "Lightweight Chrome DevTools Protocol CLI";
    mainProgram = "cdp";
  };
} ''
  mkdir -p $out/bin $out/libexec
  cp ${./cdp.mjs} $out/libexec/cdp.mjs
  chmod +x $out/libexec/cdp.mjs
  makeWrapper ${nodejs_22}/bin/node $out/bin/cdp \
    --add-flags $out/libexec/cdp.mjs
''
