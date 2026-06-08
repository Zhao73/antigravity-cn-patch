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

& $Node.Source (Join-Path $Root 'bin\antigravity-cn-patch.js') apply --prefer-download @PatchArgs
