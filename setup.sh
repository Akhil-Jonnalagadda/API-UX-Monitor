#!/bin/bash

echo "🚀 API UX Monitor - Setup Script"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1) detected"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker not detected (optional)"
    DOCKER_AVAILABLE=false
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd apps/backend
npm install
cd ../..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd apps/frontend
npm install
cd ../..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Setup environment
if [ ! -f "apps/backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp apps/backend/.env.example apps/backend/.env
    echo "✅ .env file created at apps/backend/.env"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "🎯 Choose your setup method:"
echo ""
echo "1) Docker (Recommended) - Runs everything in containers"
echo "2) Local Development - Requires PostgreSQL installed"
echo ""
read -p "Enter your choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    if [ "$DOCKER_AVAILABLE" = false ]; then
        echo "❌ Docker is not available. Please install Docker first or choose option 2."
        exit 1
    fi
    
    echo ""
    echo "🐳 Starting services with Docker..."
    docker-compose up -d
    
    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:4000"
    echo "   Health Check: http://localhost:4000/health"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 To stop:"
    echo "   docker-compose down"
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "📋 Local Development Setup Instructions:"
    echo ""
    echo "1. Ensure PostgreSQL is running"
    echo "2. Create database: createdb api_monitor"
    echo "3. Update DATABASE_URL in apps/backend/.env if needed"
    echo "4. Run migrations:"
    echo "   cd apps/backend"
    echo "   npx prisma migrate dev"
    echo "   npx prisma generate"
    echo ""
    echo "5. (Optional) Seed sample data:"
    echo "   npx ts-node prisma/seed.ts"
    echo ""
    echo "6. Start the application:"
    echo "   From root directory: npm run dev"
    echo ""
    echo "   Or start separately:"
    echo "   Terminal 1: cd apps/backend && npm run dev"
    echo "   Terminal 2: cd apps/frontend && npm run dev"
    echo ""
    echo "🌐 Access:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:4000"
    echo ""
    
    read -p "Would you like to run the migrations now? (y/n): " run_migrations
    
    if [ "$run_migrations" = "y" ]; then
        echo ""
        echo "Running database migrations..."
        cd apps/backend
        npx prisma migrate dev --name init
        npx prisma generate
        
        read -p "Would you like to seed sample data? (y/n): " seed_data
        
        if [ "$seed_data" = "y" ]; then
            echo "Seeding database..."
            npx ts-node prisma/seed.ts
        fi
        
        cd ../..
        
        echo ""
        echo "✅ Setup complete!"
        echo ""
        echo "🚀 Start the application:"
        echo "   npm run dev"
    fi
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "📖 For more information, see:"
echo "   - README.md"
echo "   - GETTING_STARTED.md"
echo ""
echo "Happy monitoring! 🎉"
