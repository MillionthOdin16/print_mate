const { createServer } = require('http');
const next = require('next');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Get the correct path for the .next directory
const nextDir = path.join(process.resourcesPath, '.next');

// Check if production build exists
const buildIdPath = path.join(nextDir, 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.error('ERROR: No Next.js production build found.');
  console.error('Expected build at:', nextDir);
  process.exit(1);
}

// For AppImage, we need to ensure Node.js can find all dependencies
// Add the resources path to NODE_PATH
process.env.NODE_PATH = `${process.resourcesPath}/app/node_modules:${process.resourcesPath}/.next/static/chunks`;
require('module').Module._initPaths();

const nextApp = next({ 
  dev: false,
  dir: process.resourcesPath,
  conf: {
    distDir: '.next',
    // Disable features that require write access
    generateBuildId: () => 'static-build',
    // Disable webpack watching
    webpack: (config) => {
      config.watch = false;
      return config;
    },
    experimental: {
      // Increase timeout for static generation
      staticPageGenerationTimeout: 1000
    }
  }
});

const handle = nextApp.getRequestHandler();

// Ensure single instance
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let server = null;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
    // Disable font warnings
    show: false
  });

  mainWindow.setMenuBarVisibility(false);
  
  // Wait for window to be ready before showing to avoid font warnings
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize Next.js and create server
nextApp.prepare().then(() => {
  server = createServer((req, res) => {
    return handle(req, res);
  });
  
  server.listen(3000, 'localhost', (err) => {
    if (err) {
      console.error('Server error:', err);
      process.exit(1);
    }
    
    console.log('> Production server ready on http://localhost:3000');
    console.log('> Serving from:', nextDir);
    app.whenReady().then(createWindow);
  });
}).catch(err => {
  console.error('Failed to prepare Next.js app:', err);
  process.exit(1);
});

// Handle app events
app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  app.quit();
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});