// // main.js

// // Modules to control application life and create native browser window
// const { app, BrowserWindow } = require('electron')
// const path = require('path')

// function createWindow () {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js')
//     }
//   })

//   // and load the index.html of the app.
//   mainWindow.loadFile('index.html')

//   // Open the DevTools.
//   // mainWindow.webContents.openDevTools()
// }

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   createWindow()

//   app.on('activate', function () {
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })

// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', function () {
//   if (process.platform !== 'darwin') app.quit()
// })

// // In this file you can include the rest of your app's specific main process
// // code. You can also put them in separate files and require them here.


// import { app, BrowserWindow, nativeTheme,ipcMain } from 'electron'
const { app, BrowserWindow , nativeTheme , ipcMain } = require('electron')
const path = require('path')


const HighLevelSockets = require('./services/socket');
const Storage = require('./services/storage');
const Wallet = require('./services/wallet');
try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = __dirname
}
global.windows={};

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */ 
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    useContentSize: true,
    webPreferences: {
      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      // nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
      nodeIntegration: true,
      // nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION,
      nodeIntegrationInWorker: true,
      contextIsolation: false

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  })
  HighLevelSockets.setMainWindow(mainWindow);
  HighLevelSockets.initialize() 
//   var address=process.env.APP_URL+'?globalid=main'; 
  var address='http://localhost:8080/'; 
  mainWindow.loadURL(address)
  global.windows['main']=mainWindow;
  mainWindow.on('closed', () => {
    mainWindow = null;
    delete global.windows['main'];
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    
    createWindow()
  }
})
global.temp={};
global.gclass={
  wallet:new Wallet(),
  storage:new Storage()
}; 
ipcMain.on('prompt-response', (_, {event,data,origin,id}) => { 
  HighLevelSockets.emit(origin,id,event,data)
});
ipcMain.on('transfer',async (_, {data,name,id,globalId}) => { 

  var resp={};
  var gclass=global.gclass[name];
  if(gclass)
  {
    var action=data.action;
    
    // console.log('>>>>>>>>>>>>>>>>',action);  
    if(action && gclass[action])
    {
      resp=await gclass[action](data.data)
    }
  }
  // console.log('-',globalId);   
  // console.log('-',resp);   
  
  if(global.windows[globalId])
  {
    global.windows[globalId].webContents.send('transfer', {id,data:resp}); 
  } 
});
