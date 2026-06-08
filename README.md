# Antigravity Chinese Patch

A reversible Simplified Chinese patcher for Google Antigravity on Windows, macOS, and Linux.

It applies three layers:

- A VS Code-compatible `zh-cn` language pack for Antigravity's workbench/NLS strings.
- A small runtime translator injected into unpacked Antigravity UI bundles.
- The same runtime translator injected into the real `app.asar` bundle that Electron launches with `--app-path`.

## One-Click Install

Windows PowerShell:

```powershell
.\install.ps1
```

macOS/Linux:

```bash
./install.sh
```

The installer backs up `app.asar`, patches it, clears Electron runtime caches, then asks you to fully quit and reopen Antigravity.

## Manual Usage

```bash
npm test
node ./bin/antigravity-cn-patch.js apply --prefer-download
```

If you already have an extracted VS Code Simplified Chinese language pack:

```bash
node ./bin/antigravity-cn-patch.js apply --source-language-pack /path/to/language-pack/extension
```

## Restore

```bash
node ./bin/antigravity-cn-patch.js restore
```

The patcher creates a backup before changing user data, unpacked UI bundles, or `app.asar`.

## Platform Paths

Default install locations:

- Windows: `%LOCALAPPDATA%\Programs\Antigravity`
- macOS: `/Applications/Antigravity.app`
- Linux: `/usr/share/antigravity`, `/opt/Antigravity`, or `/opt/antigravity`

Default user-data locations:

- Windows: `%APPDATA%\Antigravity`
- macOS: `~/Library/Application Support/Antigravity`
- Linux: `${XDG_CONFIG_HOME:-~/.config}/Antigravity`

Use `--install-dir`, `--app-data-dir`, or `--extensions-dir` if your installation is elsewhere.

## What It Ships

- Source code for the patcher.
- Antigravity-specific translation overrides.
- A runtime UI translation map.

It does not ship Antigravity binaries, Antigravity resources, VSIX files, or copied Microsoft localization payloads. The language pack can be read locally or downloaded at install time.

## Status

```bash
node ./bin/antigravity-cn-patch.js status --no-download
```

The status command reports the registered `zh-cn` language pack, unpacked UI bundle markers, and `app.asar` bundle markers.

## Sources

- VS Code localization source: <https://github.com/microsoft/vscode-loc>
- Open VSX language pack listing: <https://open-vsx.org/extension/ms-ceintl/vscode-language-pack-zh-hans>

## License

MIT. Generated local language-pack files may include MIT-licensed content from Microsoft VS Code Localization Packs; keep the upstream license notice when redistributing generated artifacts.
