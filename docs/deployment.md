# Deployment Guide for MarketingHub (Ubuntu Server 25.04)

This guide covers deploying the Node.js backend and React frontend to an Ubuntu Server 25.04 using Nginx, PM2, and MongoDB.

## Prerequisites
1. Ubuntu Server 25.04 up and running.
2. Domain name pointing to your server's IP address.
3. Node.js (v20+ recommended) and npm installed.
4. MongoDB server installed and running.
5. Nginx installed.
6. PM2 installed globally (`npm install -g pm2`).

## 1. Prepare the application
Clone the repository to your server, e.g., to `/var/www/marketinghub`.

```bash
cd /var/www/marketinghub

# Install backend dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your DB connection, JWT secret, etc.

# Build frontend
cd frontend
npm install
npm run build
```

## 2. Setup PM2 for the Backend
We use PM2 to keep the Node.js application running in the background.

```bash
cd /var/www/marketinghub
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 3. Configure Nginx
Nginx will serve the static React files and reverse proxy API requests to the Node.js backend.

Copy the provided `nginx.conf` to Nginx's sites-available:

```bash
sudo cp /var/www/marketinghub/nginx.conf /etc/nginx/sites-available/marketinghub
sudo ln -s /etc/nginx/sites-available/marketinghub /etc/nginx/sites-enabled/

# Test config and reload
sudo nginx -t
sudo systemctl reload nginx
```

## 4. SSL Configuration (Certbot)
Use Let's Encrypt to secure your application.

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Your MarketingHub is now live!
