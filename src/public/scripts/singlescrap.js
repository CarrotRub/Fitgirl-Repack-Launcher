const puppeteer = require('puppeteer');
const fs = require('fs')

const saveToJsonFile = (data) => {
  fs.writeFileSync('ftgGamesData.json', JSON.stringify(data, null, 2));
  console.log('Data saved to ftgGamesData.json, just for you.');
};
const getMagnetLinks = async (page) => {
    return await page.evaluate(() => {
      const anchorTags = document.querySelectorAll("a");
      let magnetLinks = [];
  
      anchorTags.forEach((anchorTag) => {
        const hrefAttr = anchorTag.getAttribute("href");
        if (hrefAttr && hrefAttr.includes("magnet")) {
          magnetLinks.push(hrefAttr);
        }
      });
  
      return magnetLinks;
    });
  };
  
const getGamesTitle = async (page) => {
    return await page.evaluate(() => {
      const gamesTitles = document.querySelectorAll(".entry-title");
      let myGameTitle =document.querySelector(".entry-title")
      const gamesPictures = document.querySelectorAll(".alignleft");

      myGameTitle = myGameTitle.textContent;

      let titles = [myGameTitle];
      let srcPics = [];
      
      console.log(myGameTitle)
      gamesPictures.forEach((pictureElement) => {
        const srcAttr = pictureElement.getAttribute("src");
        if (srcAttr) {
          srcPics.push(srcAttr);
        }
      });
  
      titles = titles.map(item => item === 'ΓÇô' ? '-' : item);
  
      return { titles, srcPics };
    });
};
  
const getGamesDesc = async (page) => {
    return await page.evaluate(() => {
      const gamesInfoElements = document.querySelectorAll("div.entry-content");
      let gamesInfo = [];
  
      gamesInfoElements.forEach((infoElement) => {
        const gameInfo = {};
  
        const findText = (element, searchText) => {
          const foundElement = Array.from(element.childNodes).find(node => node.textContent.includes(searchText));
          return foundElement ? foundElement.textContent.trim() : '';
        };
  
        gameInfo.info = findText(infoElement, 'Genres/Tags:') + '\n';
  
        gamesInfo.push(gameInfo);
      });
  
      return gamesInfo;
    });
};
  
  
const getGamesData = async (usableurl) => {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });
  
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
        request.abort();
      } else {
        request.continue();
      }
    });
  
    const ftgGamesData = {
      titles: [],
      srcPics: [],
      magnetLinks: [],
      descs: []
    };
  
      const url = usableurl;
    
  
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.alignleft', { visible: true });
  
      const ftgGamesDataPage = await getGamesTitle(page);
      const magnetLinksPage = await getMagnetLinks(page);
      const ftgGamesDescPage = await getGamesDesc(page);
  
      ftgGamesData.titles.push(...ftgGamesDataPage.titles);
      ftgGamesData.srcPics.push(...ftgGamesDataPage.srcPics);
      ftgGamesData.magnetLinks.push(...magnetLinksPage);
      ftgGamesData.descs.push(...ftgGamesDescPage);

  
    console.log('Extracted Titles:');
    console.log(ftgGamesData.titles);
    console.log('Link Pictures:');
    console.log(ftgGamesData.srcPics);
    console.log('Magnet Links:');
    console.log(ftgGamesData.magnetLinks);
    console.log('Descs:');
    console.log(ftgGamesData.descs);

    saveToJsonFile(ftgGamesData);
    
    await browser.close();
    return ftgGamesData;
};

module.exports = { getGamesData };