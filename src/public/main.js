const {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    dialog,
  
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
  const Swal = require('sweetalert2');
  const { spawn } = require('child_process');
  const {
    getGamesData
  } = require("../public/scripts/singlescrap");
  const {
    electron
  } = require('process');
  const {
    resolve
  } = require('path');
  const locallyInstalledGamesPath = path.resolve(__dirname, '..\\private\\library\\locally_installed_games.json');
  const downloadedGamesPath = path.resolve(__dirname, '..\\private\\library\\info_downloaded_games.json')
  
  const client = new WebTorrent();
  global.client = client;
  global.win;
  
  
  
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
  
  async function openFolder() {
      return dialog.showOpenDialog(global.win, {
          properties: ['openDirectory']
      }).then(result => {
          if (!result.canceled && result.filePaths.length > 0) {
              const selectedFolder = result.filePaths[0];
              console.log('Selected folder:', selectedFolder);
              return selectedFolder;
          } else {
              throw new Error('Folder selection cancelled.');
          }
      }).catch(err => {
          console.error(err);
          throw err; // Re-throw the error to propagate it to the caller
      });
  }
  
  async function openFolderExecutable() {
      return new Promise((resolve, reject) => {
          dialog.showOpenDialog(global.win, {
              properties: ['openFile'],
              filters: [{ name: 'Executable Files', extensions: ['exe'] }]
          }).then(result => {
              if (!result.canceled && result.filePaths.length > 0) {
                  const selectedFile = result.filePaths[0];
                  console.log('Selected file:', selectedFile);
                  resolve(selectedFile);
              } else {
                  reject(new Error('File selection cancelled.'));
              }
          }).catch(err => {
              console.error(err);
              reject(err); // Reject with the error to propagate it to the caller
          });
      });
  }
  
  async function placeGameLocally(filePath, gamePath, gameName, gameImage, gameDescription) {
      return new Promise((resolve, reject) => {
          try {
              let existingData = fs.readFileSync(filePath, 'utf8');
              let installedGameData = JSON.parse(existingData);
              installedGameData[gameName] = {
                  image: gameImage,
                  description: gameDescription,
                  path: gamePath
              };
              const updatedData = JSON.stringify(installedGameData, null, 2);
              fs.writeFileSync(filePath, updatedData);
              console.log('File has been saved');
              resolve(true);
          } catch (error) {
              console.error(error.message);
              reject(false);
          }
      });
  }
  ipcMain.handle('open-directory-path', async (event) => {
    try {
        const selectedFolder = await openFolder();
        return selectedFolder;
    } catch (error) {
        throw new Error(error);
    }
  });
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
  ipcMain.handle('show-context-menu-game', (event) => {
    const contextMenuGameTemplate = [{
            label: 'Place it in Favorites',
            click: () => {
                  console.log("Went in favorites")
            }
        },
        {
            label: 'Download',
            click: () => {
                console.log("Download started")
            }
        },
        
    ]
    const menu = Menu.buildFromTemplate(contextMenuGameTemplate)
    menu.popup({
        window: BrowserWindow.fromWebContents(event.sender)
    })
  });
  
  ipcMain.handle('show-context-menu-install-locally', async (event, titleGame, gameImage, gameDescription) => {
      const contextMenuInstallTemplate = [{
          label: 'Add it locally !',
          click: async () => {
              try {
                  const returnedGamePath = await openFolderExecutable();
                  console.log("found it", returnedGamePath);
                  const returnOfSuccess = await placeGameLocally(locallyInstalledGamesPath, returnedGamePath, titleGame, gameImage, gameDescription);
                  if (returnOfSuccess) {
                      console.log("Path saved.");
  
                      
                      try {
                          const data = await new Promise((resolve, reject) => {
                              fs.readFile(downloadedGamesPath, 'utf-8', (err, data) => {
                                  if (err) {
                                      console.error('Error reading file:', err);
                                      reject(err);
                                  } else {
                                      resolve(data);
                                  }
                              });
                          });
                      
                          let games = JSON.parse(data);
                          let actualGame = titleGame; // Use the titleGame parameter here
                          console.log(actualGame);
                          
                          // Iterate over the keys of the parsed JSON object
                          for (let key in games) {
                              if (games.hasOwnProperty(key)) {
                                  console.log(key);
                                  if (key.includes(actualGame)) {
                                      console.log(actualGame, key, "should delete");
                                      delete games[key];
                                  }
                              }
                          }
                      
                          // Write the modified data back to the file
                          const updatedData = JSON.stringify(games, null, 2);
                          fs.writeFile(downloadedGamesPath, updatedData, (err) => {
                              if (err) {
                                  console.error('Error writing file:', err);
                                  throw new Error(err);
                              } else {
                                  console.log('File has been updated');
                              }
                          });
                      
                      } catch (error) {
                          console.error(error);
                          throw new Error(error);
                      }
                      
  
                      return true;
                  } else {
                      console.error("Operation cancelled.");
                      return false;
                  }
              } catch (error) {
                  console.error(error);
                  return false;
              }
          }
      }];
      const menu = Menu.buildFromTemplate(contextMenuInstallTemplate);
      menu.popup({
          window: BrowserWindow.fromWebContents(event.sender)
      });
  });
  
  ipcMain.handle('execute-child-bridged-file', (event, filePath) => {
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
  ipcMain.handle('spawn-bridged-file', (event, filePath) => {
      try {
  
          const childProcess = spawn(filePath, [], { detached: true, stdio: 'ignore' });
          
          // Detach the child process so it can run independently
          childProcess.unref();
          
          return 'File execution started';
        } catch (error) {
          console.error('Error executing file:', error);
          return 'Error executing file';
        }
    });
  ipcMain.on('start-torrent', (event, torrentId, downloadPath) => {
  
    // Assign the torrent variable in the event handler
    global.torrent = client.add(torrentId, {
        path: downloadPath
    });
    setInterval(() => {
        if (torrent) {
            const percent = Math.round(torrent.progress * 100 * 100) / 100;
            global.win.webContents.send('updateInfo', {
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
                    global.win.webContents.send('torrentStopped');
                });
            }
        }
    }, 500);
  });
  ipcMain.on('stop-torrent', () => {
    if (global.torrent) {
        global.torrent.destroy(() => {
            global.win.webContents.send('torrentStopped');
        });
    }
  });
  ipcMain.handle('initialize-webtorrent-client', (event) => {
    try {
        const webClient = new WebTorrent();
  
        return webClient;
    } catch (error) {
        throw new Error(error)
    }
  });
  ipcMain.handle('initialize-function-torrentObj', async (event, codedFunc) => {
    try {
        return new Promise((resolve) => {
            resolve(function(torrentObj) {
                codedFunc
            })
        })
    } catch (error) {
        throw new Error(error)
    }
  })
  ipcMain.handle('format-date', (event, date, format) => {
    return moment(date).format(format);
  });
  ipcMain.handle('get-dirname', () => {
    return app.getAppPath();
  });
  ipcMain.handle('read-file', (event, filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
  });
  ipcMain.handle('read-file-sync', async (event, filePath) => {
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
  ipcMain.handle('single-scrap', async (event, linkURL) => {
    try {
        const usableData = await getGamesData(linkURL);
        return usableData;
    } catch (error) {
        throw new Error(error)
    }
  });
  ipcMain.handle('write-file', (event, filePath, updatedData, encoding) => {
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
  ipcMain.handle('read-json-file', (event, filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            try {
                const jsonData = JSON.parse(data);
                resolve(jsonData);
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
  })
  
  const createWindow = () => {
  
    global.win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1280,
        minHeight: 720,
        icon: 'src\\private\\icons\\fitgirl_icon.png',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
  
    global.win.loadFile('src\\public\\html\\index.html')
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