#!/bin/bash
# Setup script for local development
# Run: chmod +x scripts/setup-local.sh && ./scripts/setup-local.sh

set -e

echo "🚀 Artero Galeri - Local Setup"
echo "================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Edit .env.local with your credentials before continuing!"
    echo "   Required: DATABASE_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, R2_*, TOKEN_ENCRYPTION_KEY, GALLERY_JWT_SECRET, AUTH_SECRET"
    exit 1
fi

# Load env vars
set -a
source .env.local
set +a

# Check required vars
required_vars=("DATABASE_URL" "AUTH_GOOGLE_ID" "AUTH_GOOGLE_SECRET" "R2_ACCOUNT_ID" "R2_ACCESS_KEY_ID" "R2_SECRET_ACCESS_KEY" "TOKEN_ENCRYPTION_KEY" "GALLERY_JWT_SECRET" "AUTH_SECRET")
missing=0
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing: $var"
        missing=1
    fi
done

if [ $missing -eq 1 ]; then
    echo "⚠️  Please fill all required variables in .env.local"
    exit 1
fi

echo "✅ Environment variables OK"

# Generate DB schema
echo "🔧 Generating Drizzle schema..."
npm run db:generate

# Push to database
echo "🗄️  Pushing schema to database..."
npm run db:push

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Run 'npm run dev' to start dev server"
echo "   2. Open http://localhost:3000"
echo "   3. Click 'Começar' → Connect Google Drive"
echo "   4. Go to /admin/galleries/new to create your first gallery"