const { createServer } = require('http');
const next = require('next');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const nextDir = path.join(process.resourcesPath, '.next');

const buildIdPath = path.join(nextDir, 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.error('ERROR: No Next.js production build found.');
  console.error('Expected build at:', nextDir);
  process.exit(1);
}

if (process.platform === 'win32') {
  const nodeModulesPath = path.join(process.resourcesPath, 'app', 'node_modules');
  const nextStaticPath = path.join(nextDir, 'static', 'chunks');
  
  process.env.NODE_PATH = [
    nodeModulesPath,
    nextStaticPath,
    process.env.NODE_PATH || ''
  ].join(path.delimiter);
  
  require('module').Module._nodeModulePaths(nodeModulesPath);
  require('module').Module._nodeModulePaths(nextStaticPath);
} else {
  process.env.NODE_PATH = `${process.resourcesPath}/app/node_modules:${process.resourcesPath}/.next/static/chunks`;
}

require('module').Module._initPaths();

if (process.platform === 'win32') {
  const requiredNextFiles = [
    path.join(process.resourcesPath, 'app', 'node_modules', 'next', 'dist', 'compiled', 'next-server', 'app-page.runtime.prod.js'),
    path.join(process.resourcesPath, 'app', 'node_modules', 'react', 'jsx-runtime.js')
  ];
  
  for (const file of requiredNextFiles) {
    if (!fs.existsSync(file)) {
      console.warn('Missing file (may be packed in asar):', file);
      
      const alternativePaths = [
        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'next', 'dist', 'compiled', 'next-server', 'app-page.runtime.prod.js'),
        path.join(__dirname, 'node_modules', 'next', 'dist', 'compiled', 'next-server', 'app-page.runtime.prod.js'),
      ];
      
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          console.log('Found alternative at:', altPath);
          break;
        }
      }
    }
  }
}

const nextApp = next({ 
  dev: false,
  dir: process.resourcesPath,
  conf: {
    distDir: '.next',
    generateBuildId: () => 'static-build',
    webpack: (config) => {
      config.watch = false;
      if (process.platform === 'win32') {
        config.resolve = config.resolve || {};
        config.resolve.fallback = config.resolve.fallback || {};
        config.resolve.fallback.path = require.resolve('path-browserify');
      }
      return config;
    },
    experimental: {
      staticPageGenerationTimeout: 1000,
      esmExternals: false
    }
  }
});

const handle = nextApp.getRequestHandler();

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
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    show: false
  });

  mainWindow.setMenuBarVisibility(false);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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
    console.log('> Platform:', process.platform);
    console.log('> NODE_PATH:', process.env.NODE_PATH);
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