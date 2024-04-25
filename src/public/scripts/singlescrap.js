const {
  JSDOM
} = require('jsdom');
const axios = require('axios');
const fs = require('fs');

class Game {
  constructor(title, img, desc, magnetlink) {
      this.title = title;
      this.img = img;
      this.desc = desc;
      this.magnetlink = magnetlink;
  }
}

async function getGamesData(gameUrl) {
  const startTime = Date.now();
  const games = [];
  const oneGameData = 'ftgGamesData.json';

  const url = gameUrl;
  const response = await axios.get(url);
  const body = response.data;

  const dom = new JSDOM(body);
  const document = dom.window.document;

  var title = document.querySelector('.entry-title').textContent;

  // Get the src attribute of the <img> element and wrap it inside an array
  var img = document.querySelector('img.alignleft').getAttribute('src');
  
  // Get the description text and wrap it inside an array
  var desc = document.querySelector('p').textContent;
  const anchorTags = document.querySelectorAll("a");
  console.log(title)
  let magnetLink = [];

  anchorTags.forEach((anchorTag) => {
      const hrefAttr = anchorTag.getAttribute("href");
      // Check if hrefAttr is not null, contains "magnet", and does not contain "rutor"
      if (hrefAttr && hrefAttr.includes("magnet") && !hrefAttr.includes("rutor")) {
          magnetLink.push(hrefAttr);
      }
  });


  const game = new Game(title, img, desc, magnetLink);
  games.push(game);
  const jsonData = JSON.stringify(games, null, 2);
  fs.writeFileSync(oneGameData, jsonData);

  const endTime = Date.now();
  const durationTimeProcess = endTime - startTime;
  console.log(`Data has been written to ${oneGameData}. Time was: ${durationTimeProcess}ms`);
}


module.exports = { getGamesData };