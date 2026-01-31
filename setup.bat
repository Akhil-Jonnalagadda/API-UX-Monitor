@echo off
setlocal enabledelayedexpansion

echo ================================
echo API UX Monitor - Setup Script
echo ================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

for /f "tokens=1" %%v in ('node -v') do set NODE_VERSION=%%v
echo Node.js %NODE_VERSION% detected

:: Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not installed.
    pause
    exit /b 1
)

for /f "tokens=1" %%v in ('npm -v') do set NPM_VERSION=%%v
echo npm %NPM_VERSION% detected

:: Check Docker
where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo Docker detected
    set DOCKER_AVAILABLE=true
) else (
    echo Docker not detected (optional)
    set DOCKER_AVAILABLE=false
)

echo.
echo Installing dependencies...
echo.

:: Install root dependencies
echo Installing root dependencies...
call npm install

:: Install backend dependencies
echo Installing backend dependencies...
cd apps\backend
call npm install
cd ..\..

:: Install frontend dependencies
echo Installing frontend dependencies...
cd apps\frontend
call npm install
cd ..\..

echo.
echo Dependencies installed successfully!
echo.

:: Setup environment
if not exist "apps\backend\.env" (
    echo Creating backend .env file...
    copy apps\backend\.env.example apps\backend\.env
    echo .env file created at apps\backend\.env
) else (
    echo .env file already exists
)

echo.
echo Choose your setup method:
echo.
echo 1) Docker (Recommended) - Runs everything in containers
echo 2) Local Development - Requires PostgreSQL installed
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    if "%DOCKER_AVAILABLE%"=="false" (
        echo Error: Docker is not available. Please install Docker first or choose option 2.
        pause
        exit /b 1
    )
    
    echo.
    echo Starting services with Docker...
    docker-compose up -d
    
    echo.
    echo Waiting for services to be ready...
    timeout /t 10 /nobreak >nul
    
    echo.
    echo Setup complete!
    echo.
    echo Access your application:
    echo   Frontend: http://localhost:3000
    echo   Backend API: http://localhost:4000
    echo   Health Check: http://localhost:4000/health
    echo.
    echo View logs:
    echo   docker-compose logs -f
    echo.
    echo To stop:
    echo   docker-compose down
    
) else if "%choice%"=="2" (
    echo.
    echo Local Development Setup Instructions:
    echo.
    echo 1. Ensure PostgreSQL is running
    echo 2. Create database: createdb api_monitor
    echo 3. Update DATABASE_URL in apps\backend\.env if needed
    echo 4. Run migrations:
    echo    cd apps\backend
    echo    npx prisma migrate dev
    echo    npx prisma generate
    echo.
    echo 5. (Optional) Seed sample data:
    echo    npx ts-node prisma\seed.ts
    echo.
    echo 6. Start the application:
    echo    From root directory: npm run dev
    echo.
    echo    Or start separately:
    echo    Terminal 1: cd apps\backend ^&^& npm run dev
    echo    Terminal 2: cd apps\frontend ^&^& npm run dev
    echo.
    echo Access:
    echo    Frontend: http://localhost:5173
    echo    Backend API: http://localhost:4000
    echo.
    
    set /p run_migrations="Would you like to run the migrations now? (y/n): "
    
    if /i "!run_migrations!"=="y" (
        echo.
        echo Running database migrations...
        cd apps\backend
        call npx prisma migrate dev --name init
        call npx prisma generate
        
        set /p seed_data="Would you like to seed sample data? (y/n): "
        
        if /i "!seed_data!"=="y" (
            echo Seeding database...
            call npx ts-node prisma\seed.ts
        )
        
        cd ..\..
        
        echo.
        echo Setup complete!
        echo.
        echo Start the application:
        echo    npm run dev
    )
) else (
    echo Invalid choice
    pause
    exit /b 1
)

echo.
echo For more information, see:
echo    - README.md
echo    - GETTING_STARTED.md
echo.
echo Happy monitoring!
echo.
pause
