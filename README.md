# Antigravity Chinese Patch

A reversible Simplified Chinese patcher for Google Antigravity on Windows, macOS, and Linux.

It applies two layers:

- A VS Code-compatible `zh-cn` language pack for Antigravity's workbench/NLS strings.
- A small runtime translator injected into Antigravity's UI bundles for hardcoded Agent UI strings such as `New Conversation`, `Ask anything`, `Select Project`, and `Dismiss`.

## One-Click Install

Windows PowerShell:

```powershell
.\install.ps1
```

macOS/Linux:

```bash
./install.sh
```

Then fully quit and reopen Antigravity.

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

The patcher creates a backup before changing user data or installed UI bundles.

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

The status command reports both the registered `zh-cn` language pack and whether UI bundles contain the runtime patch marker.

## Sources

- VS Code localization source: <https://github.com/microsoft/vscode-loc>
- Open VSX language pack listing: <https://open-vsx.org/extension/ms-ceintl/vscode-language-pack-zh-hans>

## License

MIT. Generated local language-pack files may include MIT-licensed content from Microsoft VS Code Localization Packs; keep the upstream license notice when redistributing generated artifacts.
