#!/bin/bash
echo "==================================================="
echo "  LUNO STORE - PUSHING TO GITHUB (AUTOMATED SCRIPT)"
echo "==================================================="
echo ""

# Create public directory and copy logo and banner assets
mkdir -p public
cp "c:/Users/youse/OneDrive/Desktop/nxt/logo/12-removebg-preview.png" "./public/logo.png" 2>/dev/null
cp "/Users/youse/OneDrive/Desktop/nxt/logo/12-removebg-preview.png" "./public/logo.png" 2>/dev/null
cp "c:/Users/youse/OneDrive/Desktop/nxt/logo/baner.png" "./public/banner.png" 2>/dev/null
cp "/Users/youse/OneDrive/Desktop/nxt/logo/baner.png" "./public/banner.png" 2>/dev/null
cp "c:/Users/youse/OneDrive/Desktop/nxt/logo/Screenshot 2026-07-23 041712.png" "./public/banner_light.png" 2>/dev/null
cp "/Users/youse/OneDrive/Desktop/nxt/logo/Screenshot 2026-07-23 041712.png" "./public/banner_light.png" 2>/dev/null
cp ./logo/*انترو*.png ./public/intro.png 2>/dev/null
cp ./logo/*1.png ./public/intro.png 2>/dev/null

# Initialize Git
if [ ! -d ".git" ]; then
    echo "[1/5] Initializing Git repository..."
    git init
else
    echo "[1/5] Git repository already initialized."
fi

# Add files
echo "[2/5] Adding all files to Git..."
git add .

# Commit
echo "[3/5] Creating commit..."
git commit -m "feat: initial Luno Store premium e-commerce platform"

# Set branch
echo "[4/5] Setting main branch..."
git branch -M main

# Add remote
git remote remove origin 2>/dev/null
echo "[5/5] Linking to GitHub repository..."
git remote add origin https://github.com/lunostore/luno.git

# Push
echo ""
echo "==================================================="
echo "  PUSHING TO GITHUB..."
echo "==================================================="
git push -u origin main --force

echo ""
echo "Done! Check your repository at https://github.com/lunostore/luno"
read -p "Press enter to exit"
