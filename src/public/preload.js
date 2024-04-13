const {
  contextBridge,
  ipcRenderer
} = require('electron/renderer');
const { link, writeFile } = require('fs');
const path = require('path');
global.__dirname = __dirname;

// Expose IPC handlers to the renderer process under the scrapeAPI namespace
contextBridge.exposeInMainWorld('scrapeAPI', {
  // IPC handler for scraping data
  scrapeDataGame: async (usableUrl) => {
    try {
        return await ipcRenderer.invoke('single-scrap', usableUrl);
    } catch (error) {
        throw new Error(error);
    }
},

});

//Expose torrentAPI handlers throught a context bridge :3.
contextBridge.exposeInMainWorld('torrentAPI', {
  //Exposing the torrent start func.
  startTorrent: (torrentId, downloadPath) => ipcRenderer.send('startTorrent', torrentId, downloadPath),
  //Exposing the torrent stop func.
  stopTorrent: () => ipcRenderer.send('stopTorrent'),
  //Exposing the torrent "on" func for channeling the data continuously (not sure abt the word mb)
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  //Kill it.
  removeListener: (channel, func) => ipcRenderer.removeListener(channel, func)
});

// Expose IPC handlers to the renderer process
contextBridge.exposeInMainWorld('primaryAPI', {
  executeBridgedFile: (filePath) => {
    try {
      return ipcRenderer.invoke('executeBridgedFile', filePath)
    } catch (error) {
      throw new Error(error)
    }
  },
  // IPC handler for formatting date
  formatDate: async (date, format) => {
      try {
          return await ipcRenderer.invoke('format-date', date, format);
      } catch (error) {
          throw new Error(error);
      }
  },

  //IPC handler for reading lines from file
  readLinesFromFile: (filePath) => {
    try {
      return ipcRenderer.invoke('readLinesFromFile', filePath);
    } catch(error) {
      throw new Error(error)
    }
  },

  // IPC handler for resolving a path
  resolvePath: (...args) => {
      try {
          return path.resolve(...args);
      } catch (error) {
          throw new Error(error);
      }
  },

  //IPC handler for readFile
  readFile: async (filePath) => {
    try {
      return await ipcRenderer.invoke('readFile', filePath);
    } catch (error) {
      throw new Error(error);
    }
  },

  //IPC handler for readFileSync
  readFileSync: async (filePath) => {
    try {
      return await ipcRenderer.invoke('readFileSync', filePath)
    } catch (error) {
      throw new Error(error);
    }
    
  },

  //IPC handler for dirname
  getDirname: () => {
    return __dirname;
  },

  writeFile: (filePath, updatedData, encoding) => {
    try {
        return ipcRenderer.invoke('writeFile', filePath, updatedData, encoding);
    } catch (error) {
        throw new Error(error);
    }
  },


});