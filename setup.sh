#!/usr/bin/env bash

# GenDevAI Setup Script

echo "🚀 Setting up GenDevAI development environment..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    echo "🔑 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your API keys and secrets."
fi

# Start database containers
echo "🐳 Starting Docker containers for PostgreSQL and Redis..."
docker-compose up -d

# Generate Prisma client
echo "🔄 Generating Prisma client..."
pnpm --filter "@gendevai/database" db:generate

# Push database schema
echo "🏗️  Setting up database schema..."
pnpm --filter "@gendevai/database" db:push

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
pnpm --filter "@gendevai/database" db:seed

echo "✅ Setup complete! You can start the development server with:"
echo "   pnpm dev"
