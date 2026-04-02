#!/bin/bash
cd /root/.openclaw/workspace/catalon

git config user.email "lootziffer666@github.com"
git config user.name "Lootziffer"

git init
git add .
git commit -m "Initial commit: Catalon v2.0 - Agentic Design System"
git remote add origin https://github.com/Lootziffer666/Catalon.git
git branch -M main
git push -u origin main