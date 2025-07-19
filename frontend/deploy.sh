#!/bin/bash
set -e

# Build the React frontend
npm install
npm run build

# Copy the build to the Nginx web root
sudo mkdir -p /var/www/html/mediaserver
sudo cp -r dist/* /var/www/html/mediaserver/
sudo systemctl restart nginx

echo "Frontend built and deployed to /var/www/html/mediaserver!" 