const fs = require('fs');
const path = require('path');
const LocalStorage = require('node-localstorage').LocalStorage;
const axios = require('axios');
const localStorage = new LocalStorage('./scratch');
const { JSDOM } = require('jsdom');

const downloadedGamesPath = path.resolve(__dirname, '../../private/library/downloaded_games.json');
const infoDownloadedGamesFilePath = path.resolve(__dirname, '../../private/library/info_downloaded_games.json');
const locallyInstalledGamesPath = path.resolve(__dirname, '../../private/library/locally_installed_games.json');
const allGamesData = path.resolve(__dirname, '../../private/temp/games.json')

/* Start of platform detection */
// Determine if the user is using Windows or Linux and set the executable file extension accordingly
 // Alert the user that this app is not supported on Mac/Linux platforms
 function drawBox(message) {
  const length = message.length + 4; // Length of the message + 4 for padding and borders
  const border = "*".repeat(length); // Top and bottom border

  console.log(border);
  console.log(`* ${message} *`); // Message with padding and borders
  console.log(border);
}

const isWindows = process.platform === 'win32';

/* Console log the platform to verify the correct platform is being detected */
console.log("Platform: " + process.platform);
console.log("isWindows: " + isWindows);
console.log("");

if (isWindows) {
  drawBox("Windows platform detected.");
} else {
  drawBox("Mac/Linux platform detected. \nThis app is not supported on Mac/Linux platforms for the time being.");
}
console.log("");
/* End of platform detection */

const isFileNotEmpty = (TempPaths) => {
  try {
    for (const TempPath of TempPaths) {
      const stats = fs.statSync(TempPath);
      if (stats.size === 0) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
};

const shouldRunFunction = () => {
  const storedTimestamp = localStorage.getItem('lastExecutionTimestamp');

  if (!storedTimestamp || Date.now() - parseInt(storedTimestamp, 10) >= 1 * 60 * 60 * 1000) {
    console.log("Function can run.");
    localStorage.setItem('lastExecutionTimestamp', Date.now().toString());
    return true;
  }

  const remainingTime = (1 * 60 * 60 * 1000) - (Date.now() - parseInt(storedTimestamp, 10));
  const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
  const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
  const remainingSeconds = Math.floor((remainingTime % (60 * 1000)) / 1000);

  console.log(`Function can't run yet. Time remaining: ${remainingHours} hours, ${remainingMinutes} minutes, ${remainingSeconds} seconds.`);
  return false;
};

const resetTimestamp = () => {
  localStorage.removeItem('lastExecutionTimestamp');
  console.log("Timestamp reset.");
};

// Manually reset the timestamp for testing purposes, uncomment the line below and run the script
resetTimestamp();


class Game {
  constructor(title, img, desc, magnetlink, gDesc, gameScreenshots) {
      this.title = title;
      this.img = img;
      this.desc = desc;
      this.magnetlink = magnetlink;
      this.gDesc = gDesc;
      this.gameScreenshots = gameScreenshots;
  }
}

async function scrapingFunc() {
  const startTime = Date.now();
  const games = [];

  for (let page_number = 1; page_number <= 5; page_number++) {
      const url = `https://fitgirl-repacks.site/category/lossless-repack/page/${page_number}`;
      const response = await axios.get(url);
      const body = response.data;

      const dom = new JSDOM(body);
      const document = dom.window.document;

      const titles = document.querySelectorAll('.entry-title a');
      const pics = document.querySelectorAll('.alignleft');
      const gameScreenshots = document.querySelectorAll('p img');
      const description = document.querySelectorAll('.entry-content');
      const gameDescription = document.querySelectorAll('.su-spoiler-content p ');
      const anchorTags = document.querySelectorAll("a");
    

      const pDesc = [];
      description.forEach((descElement) => {
          const pTag = descElement.querySelector("p");
          if (pTag) {
              pDesc.push(pTag.textContent.trim());
          }
      });

    
      const gDesc = [];
      gameDescription.forEach((descElement) => {
        gDesc.push(descElement.textContent.trim());
      });

  

      let magnetLinks = [];
     
      anchorTags.forEach((anchorTag) => {
          const hrefAttr = anchorTag.getAttribute("href");
          if (hrefAttr && hrefAttr.includes("magnet")) {
              magnetLinks.push(hrefAttr);
          }
      });
      // Get the src attribute of the <img> element and wrap it inside an array
      let srcPics = [];
      pics.forEach((pictureElement) => {
          const srcAttr = pictureElement.getAttribute("src");
          if (srcAttr && srcAttr.includes("imageban")) {
              srcPics.push(srcAttr);
          }
      });

     // Get the src attribute of the <img> element and wrap it inside an array
let gamePicsSrc = [];
gameScreenshots.forEach((gamePic) => {
    const srcAttr = gamePic.getAttribute("src");
    // Check if srcAttr exists and if it includes "riotpixels"
    if (srcAttr && srcAttr.includes("riotpixels")) {
        gamePicsSrc.push(srcAttr);
    }
});

       // Log the extracted descriptions for debugging
    console.log("Description from entry-summary:", pDesc);
    console.log("Description from su-spoiler-content:", gDesc);
    console.log("Magnet links:", magnetLinks);
    console.log("Game pics:", gamePicsSrc);
    
      for (let i = 0; i < titles.length; i++) {
          const title = titles[i].textContent.trim();
          const img = srcPics[i] || '';
          const desc = pDesc[i] || '';
          const gameDesc = gDesc[i] || '';
          const gameScreenshots = gamePicsSrc[i] || '';
          const magnetLink = magnetLinks[i] || '';

          if (img.includes("imageban")) {
              const game = new Game(title, img, desc, magnetLink, gameDesc, gameScreenshots);
              games.push(game);
          }
      }
  }

  const jsonData = JSON.stringify(games, null, 2);
  fs.writeFileSync(allGamesData, jsonData);

  const endTime = Date.now();
  const durationTimeProcess = endTime - startTime;
  console.log(`Data has been written to games.json. Time was: ${durationTimeProcess}ms`);
}


async function downloadSitemap(url, filename) {
  try {

      const response = await axios.get(url, { responseType: 'stream' });
      
      const filePath = path.join(__dirname, '../html/sitemaps/', filename); 
      
      // Create any necessary directories
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      
      // Create a writable stream to save the sitemap content
      const writer = fs.createWriteStream(filePath);
      
      // Pipe the response stream into the writer stream
      response.data.pipe(writer);
      
      // Return a promise to handle completion
      return new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
      });
  } catch (error) {
      console.error(`Error downloading ${filename}:`, error);
  }
}

function iterationSitemap(){
  // Limited to 5 (the actual number of sitemap) because Fitgirl's website does not return an error but a document saying error soooo too complicated.
for (let i = 0; i < 5; i++) {
  const sitemapNumber = (i === 0) ? "" : i + 1;
  const url = `https://fitgirl-repacks.site/post-sitemap${sitemapNumber ? + sitemapNumber : ''}.xml`;
  const filename = `post-sitemap${sitemapNumber ? + sitemapNumber : ''}.xml`;

  // Call the function to download each sitemap
  downloadSitemap(url, filename).then(() => {
      console.log(`${filename} downloaded successfully.`);
  }).catch(err => {
      console.error(`Error downloading ${filename}:`, err);
  });
}
}
(async () => {
  try {
    if (isFileNotEmpty([allGamesData, downloadedGamesPath, infoDownloadedGamesFilePath, locallyInstalledGamesPath])) {
      if (shouldRunFunction()) {
        //cppProcess
        scrapingFunc();
        iterationSitemap();
        //closeCppProcess()
      } else {
        console.log("Function is not allowed to run yet. Window and file operations skipped.");
      }
    } else {
      scrapingFunc();
    }
  } catch (error) {
    console.error("Error:", error);
  }
})();


