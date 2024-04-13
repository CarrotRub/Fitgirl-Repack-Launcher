const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron')
const {
  exec
} = require('child_process');
const LocalStorage = require('node-localstorage').LocalStorage;
const path = require('node:path')
const fs = require('fs');
const moment = require('moment');
const WebTorrent = require('webtorrent');
const readline = require('readline');
const { getGamesData } = require("../public/scripts/singlescrap")

function prettyBytes(num) {
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const neg = num < 0;
  if (neg) num = -num;
  if (num < 1) return (neg ? '-' : '') + num + ' B';
  const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
  const unit = units[exponent];
  num = Number((num / Math.pow(1000, exponent)).toFixed(2));
  return (neg ? '-' : '') + num + ' ' + unit;
}

ipcMain.handle('readLinesFromFile', async (event, filePath) => {
  try {
    return new Promise((resolve, reject) => {
      const lines = [];

      const rl = readline.createInterface({
          input: fs.createReadStream(filePath),
          crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
          lines.push(line);
      });

      rl.on('close', () => {
          resolve(lines);
      });

      rl.on('error', (err) => {
          reject(err);
      });
  });
  } catch (error) {
    throw new Error(error);
  }
});

const client = new WebTorrent();
global.client = client;
global.win;

ipcMain.handle('executeBridgedFile', (event, filePath) => {
  // Execute the file
  exec(`"${filePath}"`, (error, stdout, stderr) => {
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    if (stderr) {
        console.error('stderr:', stderr);
        return;
    }
    console.log('stdout:', stdout);
});

});
ipcMain.on('startTorrent', (event, torrentId, downloadPath) => {
  
  // Assign the torrent variable in the event handler
  global.torrent = client.add(torrentId, { path: downloadPath });
  setInterval(() => {
    if (torrent) {
      const percent = Math.round(torrent.progress * 100 * 100) / 100;
        win.webContents.send('updateInfo', {
          downloadSpeed: prettyBytes(torrent.downloadSpeed),
          uploadSpeed: prettyBytes(torrent.uploadSpeed),
          progress: percent + "%",
          numPeers: torrent.numPeers,
          remaining: torrent.done ? 'Done.' : moment.duration(torrent.timeRemaining / 1000, 'seconds').humanize(),
          total: prettyBytes(torrent.length),
          downloaded: prettyBytes(torrent.downloaded),
          torrentMgn: torrentId,
          torrentDone: torrent.done,
          torrentName: torrent.name
        });
        if (torrent.done == true) {
          global.torrent.destroy(() => {
            win.webContents.send('torrentStopped');
          });
        }
    }
  }, 500);
});

ipcMain.on('stopTorrent', () => {
  if (global.torrent) {
    global.torrent.destroy(() => {
      win.webContents.send('torrentStopped');
    });
  }
});
ipcMain.handle('initialize-webtorrent-client',(event) => {
  try {
    const webClient = new WebTorrent();
    
    return webClient;
  } catch (error) {
    throw new Error(error)
  }
});
ipcMain.handle('initialize-function-torrentObj', async(event, codedFunc) => {
  try {
    return new Promise((resolve) => {
      resolve(function(torrentObj){codedFunc})
    })
  } catch (error) {
    throw new Error (error)
  }
})
ipcMain.handle('format-date', (event, date, format) => {
  return moment(date).format(format);
});
ipcMain.handle('get-dirname', () => {
  return app.getAppPath();
});
ipcMain.handle('readFile', async (event, filePath) => {
  try {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  } catch (error) {
    throw new Error(error);
  }
});
ipcMain.handle('readFileSync', async (event,filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    throw new Error(error)
  }
});
ipcMain.handle('resolve-path', async (event, ...args) => {
  return path.resolve(...args);
});
ipcMain.handle('join-path', async (event, ...args) => {
  return path.join(...args);
});
ipcMain.handle('single-scrap', async (event, linkURL) =>{
  try {
    const usableData = await getGamesData(linkURL);
    return usableData;
  } catch (error) {
   throw new Error(error)
  }
});
ipcMain.handle('writeFile', (event, filePath, updatedData, encoding) => {
  return new Promise((resolve, reject) => {
      fs.writeFile(filePath, updatedData, encoding, (err) => {
          if (err) {
              console.error('Error writing file:', err);
              reject(err);
          } else {
              console.log('File written successfully.');
              resolve();
          }
      });
  });
});
const createWindow = () => {

  global.win = new BrowserWindow({
      width: 1280,
      height: 720,
      minWidth: 1280,
      minHeight: 720,
      icon : 'src\\private\\icons\\fitgirl_icon.png' ,
      autoHideMenuBar: true,
      webPreferences: {
          nodeIntegration: true,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js')
      }
  })

  win.loadFile('src\\public\\html\\index.html')
}

const runSpecificFile = () => {
  let consoleOutput = '';

  // Override console.log to capture its output
 
  const filePath = 'src/public/scripts/scraper.js';

  const command = `node ${filePath}`;

  // Execute the command
  exec(command, (error, stdout, stderr) => {
      if (error) {
          console.error(`Error executing the command: ${error.message}`);
          return;
      }

      console.log(`${stdout}`);

      createWindow();
  });
  console.log(consoleOutput)

};

app.whenReady().then(() => {

  runSpecificFile()


  app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  
  if (process.platform !== 'darwin') app.quit()
})