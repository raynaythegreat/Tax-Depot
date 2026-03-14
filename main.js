const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'info';
log.info('Tax Depot starting...');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  app.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let mainWindow = null;
let nextServer = null;

const isDev = process.env.NODE_ENV === 'development';
const PORT = 3000;

function startNextServer() {
  return new Promise((resolve, reject) => {
    log.info('Starting Next.js server...');

    nextServer = spawn('npm', ['run', 'start'], {
      cwd: app.getAppPath(),
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, PORT: PORT.toString() }
    });

    nextServer.stdout.on('data', (data) => {
      const output = data.toString();
      log.info('Next.js:', output);
      if (output.includes('Ready in') || output.includes('started server')) {
        resolve();
      }
    });

    nextServer.stderr.on('data', (data) => {
      const output = data.toString();
      log.error('Next.js Error:', output);
    });

    nextServer.on('error', (err) => {
      log.error('Failed to start Next.js:', err);
      reject(err);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      resolve(); // Resolve anyway to try loading
    }, 30000);
  });
}

function createWindow() {
  log.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Tax Depot',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#ffffff'
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('Window shown');
  });

  const url = isDev
    ? `http://localhost:${PORT}`
    : `http://localhost:${PORT}`;

  log.info(`Loading URL: ${url}`);
  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('unresponsive', () => {
    log.warn('Window became unresponsive');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error('Failed to load:', errorCode, errorDescription);
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log.info('Another instance is running, quitting...');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    log.info('App ready');

    try {
      await startNextServer();
      createWindow();
    } catch (err) {
      log.error('Failed to start:', err);
      app.exit(1);
    }
  });
}

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (nextServer) {
    nextServer.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  log.info('App quitting...');
  if (nextServer) {
    nextServer.kill();
  }
});