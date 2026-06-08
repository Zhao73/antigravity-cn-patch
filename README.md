# Antigravity Chinese Patch

A reversible Simplified Chinese language-pack patcher for Google Antigravity on Windows.

This project does **not** modify `Antigravity.exe`, `app.asar`, or installed program files. It installs a user-local VS Code-compatible language pack, registers `zh-cn` in Antigravity's user data, and keeps backups for restore.

## What It Changes

- Writes a generated language pack under `%USERPROFILE%\.antigravity\extensions\codex.antigravity-cn-patch-0.1.0`
- Updates `%APPDATA%\Antigravity\languagepacks.json`
- Updates `%APPDATA%\Antigravity\User\locale.json`

## What It Does Not Ship

- No Antigravity binaries or resources
- No prepackaged VSIX files
- No copied VS Code language-pack payload in this repository

The patcher can read a local extracted VS Code Chinese language pack or download a matching VS Code 1.104 language pack at apply time. VS Code localization packs are MIT licensed; see the upstream repository: <https://github.com/microsoft/vscode-loc>.

## Usage

```powershell
npm test
node .\bin\antigravity-cn-patch.js apply --prefer-download
```

If you already have an extracted language pack:

```powershell
node .\bin\antigravity-cn-patch.js apply --source-language-pack "C:\path\to\language-pack\extension"
```

Then restart Antigravity.

## Status

```powershell
node .\bin\antigravity-cn-patch.js status --no-download
```

## Restore

```powershell
node .\bin\antigravity-cn-patch.js restore
```

The restore command uses the latest backup in `%APPDATA%\Antigravity\antigravity-cn-patch-backups`.

## Translation Coverage

For Antigravity 2.0.11 / workbench 1.104.0, the matching VS Code 1.104 Simplified Chinese language pack covered 15,436 of 16,018 workbench keys, or 96.37%, in local testing. This project adds Antigravity-specific overrides and uses Chinese fallback placeholders for remaining untranslated keys so English does not silently leak back into the UI.

Those fallback placeholders are intentionally visible as `待补译: ...`; they are invitations for future translation cleanup, not a claim that every string is polished.

## Sources

- VS Code localization source: <https://github.com/microsoft/vscode-loc>
- Open VSX language pack listing: <https://open-vsx.org/extension/ms-ceintl/vscode-language-pack-zh-hans>

## License

MIT. Generated local language-pack files may include MIT-licensed content from Microsoft VS Code Localization Packs; keep the upstream license notice when redistributing generated artifacts.
