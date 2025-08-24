// main.js
const { createServer } = require('http');
const next = require('next');
const { app, BrowserWindow } = require('electron');

const nextApp = next({ dev: false });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(3000, () => {
    console.log('Next.js server running on http://localhost:3000');

    app.whenReady().then(() => {
      const win = new BrowserWindow({ width: 1280, height: 800 });
      win.setMenuBarVisibility(false);
      win.loadURL('http://localhost:3000');
    });
  });
});
