const { contextBridge, ipcRenderer } = require('electron');

const { getGamesData } = require("../public/scripts/singlescrap");

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateCounter: (callback) => ipcRenderer.on('scrape-this-link', (_event, value) => callback(value))
})

window.addEventListener('DOMContentLoaded', async function() {

  const clickableLink = document.getElementById("results-a")
  clickableLink.addEventListener("click", async() => {
    const _clickedHref = this.href;

    ipcRenderer.on('scrape-this-link', (_event, value) => {
      getGamesData(value)
    })
  })
  function catchNewWindow(link){
      let gameGrid = document.querySelector(".game-grid");
      let gameContainer = document.querySelector(".game-container");

      gameGrid.innerHTML = '';
      

      let gameMainPic = document.createElement("div");
      gameMainPic.className = "game-pic"


      gameContainer.append(gameMainPic)
  }
  

});