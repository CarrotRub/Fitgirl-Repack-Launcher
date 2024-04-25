const {
  contextBridge,
  ipcRenderer
} = require('electron/renderer');
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
  startTorrent: (torrentId, downloadPath) => ipcRenderer.send('start-torrent', torrentId, downloadPath),
  //Exposing the torrent stop func.
  stopTorrent: () => ipcRenderer.send('stop-torrent'),
  //Exposing the torrent "on" func for channeling the data continuously (not sure abt the word mb)
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  //Kill it.
  removeListener: (channel, func) => ipcRenderer.removeListener(channel, func)
});

// Expose primary functions handlers to the renderer process.
contextBridge.exposeInMainWorld('primaryAPI', {

  existsFunc: (path) => {
    try {
      return ipcRenderer.invoke('exists-sync', path)
    }catch(error) {
      throw new Error(error)
    }
  },

  openPathDir: () => {
    try {
      return ipcRenderer.invoke('open-directory-path');
    } catch (error) {
      throw new Error(error)
    }
  },

  spawnBridgedFile : (filePath) => {
    try {
      return ipcRenderer.invoke('spawn-bridged-file', filePath)
    } catch (error){
      throw new Error(error)
    }
  },
  executeBridgedFile: (filePath) => {
    try {
      return ipcRenderer.invoke('execute-child-bridged-file', filePath)
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
      return await ipcRenderer.invoke('read-file', filePath);
    } catch (error) {
      throw new Error(error);
    }
  },

  //IPC handler for readFileSync
  readFileSync: async (filePath) => {
    try {
      return await ipcRenderer.invoke('read-file-sync', filePath)
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
        return ipcRenderer.invoke('write-file', filePath, updatedData, encoding);
    } catch (error) {
        throw new Error(error);
    }
  },


  readJSONFile: (filePath) => {
    try {
      return ipcRenderer.invoke('read-json-file', filePath);
    } catch (error) {
      throw new Error(error);
    }
  }
});

// Expose secondary functions handlers to the renderer process.
contextBridge.exposeInMainWorld('secondaryAPI', {
  contextMenuGame: () => {
    try {
      return ipcRenderer.invoke('show-context-menu-game');
    } catch (error) {
      throw new Error(error);
    }
  },
  /**
   * @param {string} /Game title
   * @param {string} /Link to image for Game
   * @param {string} /Description of the Game.
   * @returns {string} Path to location.
  */
  contextMenuLocalInstall: async (titleGame, gameImage, gameDescription) => {
    try {
        return ipcRenderer.invoke('show-context-menu-install-locally', titleGame, gameImage, gameDescription);
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}
})