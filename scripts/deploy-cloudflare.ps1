# Set memory limit to 3GB to stay within safe bounds of 3.8GB free RAM
$env:NODE_OPTIONS="--max-old-space-size=3072"
# Add current directory to PATH so next-on-pages can find our 'npx.cmd' shim even if it spawns 'npx'
$env:PATH = "$pwd;" + $env:PATH + ";C:\Program Files\nodejs;C:\Program Files\Git\bin"
$ProjectName = "schoolnexuspro"

Write-Host "Starting Cloudflare Pages deployment for $ProjectName..." -ForegroundColor Cyan

# Check for Git Bash
if (!(Test-Path "C:\Program Files\Git\bin\bash.exe")) {
    Write-Host "Error: Git Bash not found. Please install Git for Windows." -ForegroundColor Red
    exit 1
}

Write-Host "Building project for Cloudflare Edge..." -ForegroundColor Yellow
# Run next-on-pages CLI.
npx.cmd @cloudflare/next-on-pages@1 --no-color

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Checking for common Windows/RAM issues..." -ForegroundColor Red
    exit 1
}

Write-Host "Deploying to Cloudflare Pages..." -ForegroundColor Yellow
npx.cmd wrangler pages deploy .vercel/output/static --project-name $ProjectName

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Done! Deployment successful!" -ForegroundColor Green
