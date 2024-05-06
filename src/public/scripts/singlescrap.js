const { JSDOM } = require('jsdom');
const axios = require('axios');
const fs = require('fs');

class Game {
  constructor(title, img, desc, gameDesc, magnetlink, gameScreenshots) {
    this.title = title;
    this.img = img;
    this.desc = desc;
    this.gameDesc = gameDesc;
    this.magnetlink = magnetlink;
    this.gameScreenshots = gameScreenshots;
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

  let gameScreenshots = []; // Initialize gameScreenshots as an array to store multiple screenshots

  // Select all <img> elements within <p> tags and loop through them
  document.querySelectorAll('p img').forEach(imgElement => {
    const src = imgElement.getAttribute('src');
    gameScreenshots.push(src); // Push each src attribute to the gameScreenshots array
    console.log("Game Screenshots22:", gameScreenshots);
  });

  // Log the array of game screenshots
  console.log("Game Screenshots:", gameScreenshots);
  
  // Get the description text and wrap it inside an array
  var desc = document.querySelector('p').textContent;
  const anchorTags = document.querySelectorAll("a");
  console.log(`Called from SingleScrap.. ${title}`);

  // Get the game description text and wrap it inside an array TODO: Check if this is correct
  const gameDesc = [];
  const gameDescription = document.querySelectorAll('.su-spoiler-content p ');
  gameDescription.forEach((descElement) => {
    gameDesc.push(descElement.textContent.trim());
  });

  let magnetLink = [];

  anchorTags.forEach((anchorTag) => {
    const hrefAttr = anchorTag.getAttribute("href");
    // Check if hrefAttr is not null, contains "magnet", and does not contain "rutor"
    if (hrefAttr && hrefAttr.includes("magnet") && !hrefAttr.includes("rutor")) {
      magnetLink.push(hrefAttr);
    }
  });

  const game = new Game(title, img, desc, gameDesc, magnetLink, gameScreenshots);
  games.push(game); 
  const jsonData = JSON.stringify(games, null, 2);
  fs.writeFileSync(oneGameData, jsonData);

  const endTime = Date.now();
  const durationTimeProcess = endTime - startTime;
  console.log(`Data has been written to ${oneGameData}. Time was: ${durationTimeProcess}ms`);
  console.log("Game data has been written to ftgGamesData.json.", gameScreenshots);
}

module.exports = { getGamesData };
