/**
 * GitSwitch - Main Process Entry Point
 * 
 * This is the Electron main process that handles:
 * - Window management
 * - IPC communication
 * - Service initialization
 */

import { app, BrowserWindow, shell, dialog } from 'electron';
import * as path from 'path';
import { createLogger, ensureDir, getAppDataDir } from './utils';

const logger = createLogger('Main');

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

// Development mode flag
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Get the correct path for the renderer index.html
 */
function getRendererPath(): string {
    if (isDev) {
        // In dev, use relative path from compiled output
        return path.join(__dirname, '../../renderer/index.html');
    } else {
        // In production, files are relative to app.asar
        // Structure inside asar: dist/main/main/index.js and dist/renderer/index.html
        return path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
    }
}

/**
 * Get the correct path for the preload script
 */
function getPreloadPath(): string {
    if (isDev) {
        return path.join(__dirname, 'preload.js');
    } else {
        return path.join(app.getAppPath(), 'dist', 'main', 'main', 'preload.js');
    }
}

/**
 * Create the main application window
 */
async function createWindow(): Promise<void> {
    logger.info('Creating main window');

    const preloadPath = getPreloadPath();
    logger.info('Preload path:', { preloadPath });

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'GitSwitch',
        backgroundColor: '#0d1117', // GitHub dark theme background
        show: false, // Don't show until ready
        autoHideMenuBar: true, // Hide the default menu bar
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: preloadPath,
        },
    });

    // Show window when ready to prevent flickering
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Load the app
    if (isDev) {
        // Development: load from Vite dev server with retry
        const maxRetries = 10;
        let loaded = false;

        for (let i = 0; i < maxRetries && !loaded; i++) {
            try {
                await mainWindow.loadURL('http://localhost:5173');
                loaded = true;
            } catch (error) {
                logger.info(`Waiting for Vite dev server... (attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!loaded) {
            logger.error('Failed to connect to Vite dev server after retries');
            const rendererPath = getRendererPath();
            logger.info('Falling back to file:', { rendererPath });
            await mainWindow.loadFile(rendererPath);
        }

        mainWindow.webContents.openDevTools();
    } else {
        // Production: load from built files
        const rendererPath = getRendererPath();
        logger.info('Loading production renderer from:', { rendererPath });
        await mainWindow.loadFile(rendererPath);
    }

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Clean up on close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    logger.info('Main window created successfully');
}

/**
 * Initialize application data directories
 */
async function initializeAppDirs(): Promise<void> {
    const appDataDir = getAppDataDir();
    await ensureDir(appDataDir);
    await ensureDir(path.join(appDataDir, 'backups'));
    await ensureDir(path.join(appDataDir, 'audit'));
    logger.info('Application directories initialized', { appDataDir });
}

/**
 * Register IPC handlers
 */
function registerIpcHandlers(): void {
    logger.info('Registering IPC handlers');

    // Import and register all IPC handlers
    // Using dynamic imports that work with TypeScript
    import('./ipc/profiles.ipc');
    import('./ipc/repos.ipc');
    import('./ipc/discovery.ipc');
    import('./ipc/settings.ipc');
    import('./ipc/ssh.ipc');
    import('./ipc/backup.ipc');
    import('./ipc/util.ipc');

    logger.info('IPC handlers registered');
}

/**
 * App lifecycle events
 */
app.whenReady().then(async () => {
    logger.info('Application starting', {
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        isDev,
        appPath: app.getAppPath(),
    });

    try {
        // Initialize directories
        await initializeAppDirs();

        // Register IPC handlers
        registerIpcHandlers();

        // Create main window
        await createWindow();

        // macOS: Recreate window when dock icon clicked
        app.on('activate', async () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                await createWindow();
            }
        });

        logger.info('Application started successfully');
    } catch (error) {
        logger.error('Failed to start application', error);
        dialog.showErrorBox(
            'Startup Error',
            'GitSwitch failed to start. Please check the logs and try again.'
        );
        app.quit();
    }
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        logger.info('All windows closed, quitting');
        app.quit();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
});

// Export for testing
export { mainWindow };
