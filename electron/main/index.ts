import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'os'
import { join, dirname } from 'path'
import fs from 'fs';

const electron = require('electron');
const child_process = require('child_process');
const dialog = electron.dialog;


let APP_CONFIG = {
  clientLocation: '', 
  serverList: [],
};

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

export const ROOT_PATH = {
  // /dist
  dist: join(__dirname, '../..'),
  // /dist or /public
  public: join(__dirname, app.isPackaged ? '../..' : '../../../public'),
}

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(ROOT_PATH.dist, 'index.html')

const maple2 = join(__dirname, app.isPackaged ? '../../../../../Maple2.dll' : '../../../electron/resources/Maple2.dll');
const maple2edit = join(__dirname, app.isPackaged ? '../../../../../maple2edit/Maple2Edit.dll' : '../../../electron/resources/maple2edit/Maple2Edit.dll');
const downloader = join(__dirname, app.isPackaged ? '../../../../../downloader/DepotDownloaderMod.dll' : '../../../electron/resources/downloader/DepotDownloaderMod.dll');
const depotKey = join(__dirname, app.isPackaged ? '../../../../../downloader/depot.key' : '../../../electron/resources/downloader/depot.key');
const manifest = join(__dirname, app.isPackaged ? '../../../../../downloader/560381_3190888022545443868.manifest' : '../../../electron/resources/downloader/560381_3190888022545443868.manifest');

async function createWindow() {
  win = new BrowserWindow({
    title: 'Mushroom Launcher',
    icon: join(ROOT_PATH.public, 'favicon.ico'),
    autoHideMenuBar: true,
    resizable: true,
    width: 900,
    height: 600,
    minWidth: 500,
    minHeight: 500,
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  })

  if (app.isPackaged) {
    win.loadFile(indexHtml)
  } else {
    win.loadURL(url)
    win.webContents.openDevTools()
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    if (url.startsWith('maple:')) {
      const serverString = url.replace('maple:', '');
      const ip = serverString.split(':')[0];
      const port = serverString.split(':')[1];
      if (!ip || !port) return { action: 'deny' };
      const clientUrl = APP_CONFIG.clientLocation + '/x64/MapleStory2.exe';

      const serverEntry = APP_CONFIG.serverList.find(server => server.ip === ip && server.port === +port);

      // Write to Maple2.ini file with server information
      fs.writeFileSync(APP_CONFIG.clientLocation + '/x64/maple2.ini',
        `[default]
name=${serverEntry?.name}
host=${ip}
port=${port}
banword=true
multiclient=true
visualizer=false
log_exceptions=false
hook_outpacket=false
hook_inpacket=false`);

      if (!clientUrl) return { action: 'deny' };

      const clientProcess = child_process.spawn(clientUrl, [], {
        encoding: 'utf8',
        detached: true,
      });

      // Minimize the client window
      win.minimize();
    }

    if (url.startsWith('download:')) {
      const clientUrl = url.replace('download:', '');
      if (!clientUrl) return { action: 'deny' };

      // Check if the client already exists at the given location
      const exe = join(clientUrl, 'x64', 'MapleStory2.exe');
      if (fs.existsSync(exe)) return { action: 'deny' };

      run_script('dotnet', [`${downloader}`, `-app 560380`, `-depot 560381`, `-depotkeys ${depotKey}`, `-manifest 3190888022545443868`, `-manifestfile ${manifest}`, `-dir ${clientUrl}`], () => { });
    }

    if (url.startsWith('patch:')) {
      const clientUrl = url.replace('patch:', '');
      console.log(clientUrl);
      console.log(maple2);

      // Copy Maple2.dll to client/x64/Maple2.dll
      fs.copyFileSync(maple2, join(clientUrl, 'x64', 'Maple2.dll'));

      // Update NxCharacter64.dll to include Maple2.dll in the imports
      run_script('dotnet', [`${maple2edit}`, `${clientUrl}`], () => { });
    }

    return { action: 'deny' }
  })

  // Load APP_CONFIG
  fs.readFile(join(dirname(process.execPath), 'app-config.json'), (err, data) => {
    if (err) return;
    APP_CONFIG = JSON.parse(data.toString());
  });
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()

  // Save APP_CONFIG to disk
  fs.writeFileSync(join(dirname(process.execPath), 'app-config.json'), JSON.stringify(APP_CONFIG));
  console.log('APP_CONFIG saved to disk', join(dirname(process.execPath), 'app-config.json'));
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// new window example arg: new windows url
ipcMain.handle('open-win', (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
    },
  })

  if (app.isPackaged) {
    childWindow.loadFile(indexHtml, { hash: arg })
  } else {
    childWindow.loadURL(`${url}/#${arg}`)
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
})

ipcMain.on('select-client-dir', (event, arg) => {
  const result = dialog.showOpenDialogSync({ properties: ['openDirectory'] });
  console.log(result);
  if (result && result.length > 0) {
    event.returnValue = result[0];
    APP_CONFIG.clientLocation = result[0];
  }
  event.returnValue = undefined;
});

ipcMain.on('get-client-location', (event, arg) => {
  event.returnValue = APP_CONFIG.clientLocation;
});

ipcMain.on('get-server-list', (event, arg) => {
  event.returnValue = APP_CONFIG.serverList;
});

ipcMain.on('add-server-to-list', (event, ...args) => {
  console.log(args);
  APP_CONFIG.serverList.push({ id: Math.random().toString(36).substring(2), ip: args[0], port: args[1], name: args[2] });
  event.returnValue = undefined;
});

ipcMain.on('remove-server-from-list', (event, arg) => {
  APP_CONFIG.serverList = APP_CONFIG.serverList.filter(server => server.id !== arg);
  event.returnValue = undefined;
});

// This function will output the lines from the script 
// and will return the full combined output
// as well as exit code when it's done (using the callback).
function run_script(command, args, callback) {
  var child = child_process.spawn(command, args, {
    encoding: 'utf8',
    detached: true,
    shell: true
  });
  // You can also use a variable to save the output for when the script closes later
  child.on('error', (error) => {
    dialog.showMessageBox({
      title: 'Title',
      type: 'warning',
      message: 'Error occured.\r\n' + error
    });
  });

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (data) => {
    //Here is the output
    data = data.toString();
    console.log(data);
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (data) => {
    // Return some data to the renderer process with the mainprocess-response ID
    win.webContents.send('mainprocess-response', data);
    //Here is the output from the command
    console.log(data);
  });

  child.on('close', (code) => {
    //Here you can get the exit code of the script  
    switch (code) {
      case 0:
        dialog.showMessageBox({
          title: 'Mushroom Launcher',
          type: 'info',
          message: 'Patching complete.\r\n'
        });
        break;
    }

  });
  if (typeof callback === 'function')
    callback();
}
