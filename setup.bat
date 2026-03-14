@echo off
echo ===================================
echo Tax Depot - Setup Script
echo ===================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%
echo.

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps

if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo Dependencies installed
echo.

REM Generate Prisma client
echo Generating Prisma client...
call npx prisma generate

if %ERRORLEVEL% neq 0 (
    echo Failed to generate Prisma client
    pause
    exit /b 1
)

echo Prisma client generated
echo.

REM Create database
echo Creating SQLite database...
call npx prisma db push

if %ERRORLEVEL% neq 0 (
    echo Failed to create database
    pause
    exit /b 1
)

echo.
echo ===================================
echo Setup Complete!
echo ===================================
echo.
echo To start the development server:
echo   npm run dev
echo.
echo Then open http://localhost:3000 in your browser
echo.
pause
