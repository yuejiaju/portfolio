$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$node = "D:\deepseek\tools\node-v24.16.0-win-x64\node.exe"
$wrangler = "D:\deepseek\tools\npm-global\wrangler.cmd"

if (-not (Test-Path -LiteralPath $node)) {
  throw "Node.js not found: $node"
}

if (-not (Test-Path -LiteralPath $wrangler)) {
  throw "Wrangler not found: $wrangler"
}

$env:PATH = "D:\deepseek\tools\node-v24.16.0-win-x64;D:\deepseek\tools\npm-global;$env:PATH"
$env:HOME = "D:\deepseek\home"
$env:XDG_CONFIG_HOME = "D:\deepseek\tools\config"
$env:WRANGLER_HOME = "D:\deepseek\home\.wrangler"
$env:TMP = "D:\deepseek\tmp"
$env:TEMP = "D:\deepseek\tmp"

Set-Location -LiteralPath $root

Write-Host "Building portfolio..."
& $node "build.mjs"
if ($LASTEXITCODE -ne 0) {
  throw "Build failed."
}

Write-Host "Publishing to Cloudflare Pages..."
& $wrangler pages deploy dist --project-name yuejiaju-portfolio --branch main
if ($LASTEXITCODE -ne 0) {
  throw "Deployment failed."
}

Write-Host ""
Write-Host "Published: https://yuejiaju-portfolio.pages.dev/"
