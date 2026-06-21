$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "=== nutrifarmer-v5000 GitHub push & Vercel deploy ===" -ForegroundColor Cyan
Write-Host "repo: $repo"

# Git init
if (-not (Test-Path "$repo\.git")) {
    & git -C $repo init
    & git -C $repo branch -M main
}

# Remote
$remotes = & git -C $repo remote 2>&1
if ($remotes -notcontains "origin") {
    & git -C $repo remote add origin "https://github.com/waterstar21g-png/nutrifarmer-v5000.git"
    Write-Host "remote added" -ForegroundColor Green
} else {
    Write-Host "remote exists" -ForegroundColor Green
}

# Stage & commit
& git -C $repo add app/ components/ lib/ public/ next.config.ts tsconfig.json package.json package-lock.json postcss.config.mjs .gitignore README.md 2>&1
& git -C $repo commit -m "feat: nutrifarmer-v5000 initial - shadcn/ui + Pretendard + GalleryGrid"
Write-Host "committed" -ForegroundColor Green

# Push
& git -C $repo push -u origin main --force
Write-Host ""
Write-Host "=== Push complete! ===" -ForegroundColor Yellow
Write-Host "Next: Go to https://vercel.com/new and import:" -ForegroundColor Yellow
Write-Host "  waterstar21g-png/nutrifarmer-v5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Environment Variables to set in Vercel:" -ForegroundColor Cyan
Write-Host "  WP_API_URL = https://www.nutrifarmer.kr/wp-json" -ForegroundColor White
Write-Host "  WP_HOSTNAME = www.nutrifarmer.kr" -ForegroundColor White
Write-Host "  NEXT_PUBLIC_SITE_URL = https://nutrifarmer-v5000.vercel.app" -ForegroundColor White
