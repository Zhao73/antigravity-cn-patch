param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $PatchArgs
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Node = Get-Command node -ErrorAction SilentlyContinue

if (-not $Node) {
  throw 'Node.js 20 or newer is required. Install Node.js first, then rerun install.ps1.'
}

if (-not (Test-Path (Join-Path $Root 'node_modules\@electron\asar'))) {
  $Npm = Get-Command npm -ErrorAction SilentlyContinue
  if (-not $Npm) {
    throw 'npm is required to install patcher dependencies.'
  }
  & $Npm.Source install --omit=dev --prefix $Root
}

& $Node.Source (Join-Path $Root 'bin\antigravity-cn-patch.js') apply --prefer-download @PatchArgs
