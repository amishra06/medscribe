#!/bin/bash

# Vultr Deployment Script for MedScribe Backend

echo "🚀 Deploying MedScribe to Vultr..."

# Configuration
VULTR_INSTANCE_IP="your-vultr-ip-here"
SSH_KEY_PATH="~/.ssh/id_rsa"

echo "📦 Installing dependencies..."
cd backend
npm install --production

echo "🔐 Setting up environment..."
# Note: You'll need to manually set environment variables on Vultr

echo "✅ Deployment preparation complete!"
echo "Next steps:"
echo "1. SSH into your Vultr instance: ssh root@$VULTR_INSTANCE_IP"
echo "2. Install Node.js: curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs"
echo "3. Upload your code: scp -r backend root@$VULTR_INSTANCE_IP:/var/www/medscribe"
echo "4. Set environment variables in /var/www/medscribe/backend/.env"
echo "5. Install PM2: npm install -g pm2"
echo "6. Start app: cd /var/www/medscribe/backend && pm2 start src/server.js --name medscribe"
