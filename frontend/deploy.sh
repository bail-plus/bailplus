#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Variables
APP_DIR="/home/gaignerot/bailogenius-front"
IMAGE_NAME="bailogenius-front"
IMAGE_TAG="latest"

# Create app directory if it doesn't exist
mkdir -p $APP_DIR

# Navigate to app directory
cd $APP_DIR

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Remove old images
echo "🧹 Cleaning up old images..."
docker rmi $IMAGE_NAME:$IMAGE_TAG || true

# Load the new Docker image (sent from GitHub Actions)
if [ -f "$APP_DIR/bailogenius-front.tar" ]; then
    echo "📦 Loading Docker image..."
    docker load -i $APP_DIR/bailogenius-front.tar
    rm $APP_DIR/bailogenius-front.tar
fi

# Start containers
echo "▶️  Starting containers..."
docker-compose up -d

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

# Check if container is running
if docker ps | grep -q bailogenius-front; then
    echo "✅ Container is running"
else
    echo "❌ Container failed to start"
    docker logs bailogenius-front
    exit 1
fi

# Clean up unused Docker resources
echo "🧹 Cleaning up unused Docker resources..."
docker system prune -f

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be available at https://bailogenius.gaignerot.com"
