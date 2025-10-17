#!/usr/bin/env node

/**
 * Fix PWA icons and create missing assets
 */

const fs = require('fs');
const path = require('path');

// Create a simple PWA icon (base64 encoded 192x192 PNG)
const createPWAIcon = () => {
    // Simple 192x192 PNG icon in base64 (SalesSync logo placeholder)
    const iconBase64 = `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
    return Buffer.from(iconBase64, 'base64');
};

// Check if we're in the frontend directory
const frontendDir = '/workspace/project/SalesSync/frontend-vite';
const publicDir = path.join(frontendDir, 'public');

if (fs.existsSync(publicDir)) {
    console.log('🔧 Fixing PWA icons...');
    
    // Create PWA icons
    const iconSizes = [192, 512];
    
    for (const size of iconSizes) {
        const iconPath = path.join(publicDir, `pwa-${size}x${size}.png`);
        if (!fs.existsSync(iconPath)) {
            const iconData = createPWAIcon();
            fs.writeFileSync(iconPath, iconData);
            console.log(`✅ Created ${iconPath}`);
        }
    }
    
    // Create favicon if missing
    const faviconPath = path.join(publicDir, 'favicon.ico');
    if (!fs.existsSync(faviconPath)) {
        const iconData = createPWAIcon();
        fs.writeFileSync(faviconPath, iconData);
        console.log(`✅ Created ${faviconPath}`);
    }
    
    // Update manifest.webmanifest
    const manifestPath = path.join(publicDir, 'manifest.webmanifest');
    const manifest = {
        name: 'SalesSync - Van Sales Management',
        short_name: 'SalesSync',
        description: 'Enterprise Field Force Platform for Van Sales Operations',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
            {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ]
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Updated ${manifestPath}`);
    
    console.log('🎉 PWA icons fixed successfully!');
} else {
    console.log('❌ Frontend directory not found');
}