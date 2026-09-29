# Setup script for local development (Windows PowerShell)
# Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser; .\scripts\setup-local.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Artero Galeri - Local Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "⚠️  Edit .env.local with your credentials before continuing!" -ForegroundColor Red
    Write-Host "   Required: DATABASE_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, R2_*, TOKEN_ENCRYPTION_KEY, GALLERY_JWT_SECRET, AUTH_SECRET"
    exit 1
}

# Load env vars
$envContent = Get-Content ".env.local" -Raw
$envContent.Split([Environment]::NewLine) | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Check required vars
$requiredVars = @("DATABASE_URL", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "TOKEN_ENCRYPTION_KEY", "GALLERY_JWT_SECRET", "AUTH_SECRET")
$missing = 0
foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
        Write-Host "❌ Missing: $var" -ForegroundColor Red
        $missing = 1
    }
}

if ($missing -eq 1) {
    Write-Host "⚠️  Please fill all required variables in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables OK" -ForegroundColor Green

# Generate DB schema
Write-Host "🔧 Generating Drizzle schema..." -ForegroundColor Cyan
npm run db:generate

# Push to database
Write-Host "🗄️  Pushing schema to database..." -ForegroundColor Cyan
npm run db:push

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run 'npm run dev' to start dev server"
Write-Host "   2. Open http://localhost:3000"
Write-Host "   3. Click 'Começar' → Connect Google Drive"
Write-Host "   4. Go to /admin/galleries/new to create your first gallery"