{
  runCommand,
  makeWrapper,
  nodejs_22,
  ungoogled-chromium,
}:

runCommand "chrome-cdp"
  {
    nativeBuildInputs = [
      makeWrapper
      ungoogled-chromium
    ];
    meta = {
      description = "Lightweight Chrome DevTools Protocol CLI";
      mainProgram = "cdp";
    };
  }
  ''
    mkdir -p $out/bin $out/libexec
    cp ${./cdp.mjs} $out/libexec/cdp.mjs
    chmod +x $out/libexec/cdp.mjs
    makeWrapper ${nodejs_22}/bin/node $out/bin/cdp \
      --add-flags $out/libexec/cdp.mjs \
      --prefix PATH : ${ungoogled-chromium}/bin

    mkdir -p $out/share/skills
    cp -r ${./skill} $out/share/skills/chrome-cdp
  ''
