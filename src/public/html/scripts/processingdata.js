document.addEventListener('DOMContentLoaded', async function() {


    const {
        torrentAPI,
        primaryAPI,
        secondaryAPI
    } = window;
    const dirname = await primaryAPI.getDirname();

    // Start from HTML.
    const myGamesFilePath = primaryAPI.resolvePath(dirname, '../../src/private/temp/games.json')
    const downloadedGames = primaryAPI.resolvePath(dirname, '../../src/private/library/downloaded_games.json');
    const infoDownloadedGamesFile = primaryAPI.resolvePath(dirname, '../../src/private/library/info_downloaded_games.json')
    const autoInstallerPath = primaryAPI.resolvePath(dirname, '../public/apps/bin/installer.exe');

    let intervalId = null;

    var isDownloading = false;
    var ScrapingUrl = getUrlParameter('url');

    let isUITorrentNameInJSON = false;

    /**
     * Stop UI update process. 
     * 
     * (Usually at the changing of a new window)
     */
    function stopUIUpdate() {
        console.log(intervalId)
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;

        }
    }
    /**
     * Update the UI of game-container to a single game UI.
     * 
     * By reading the file 'ftgGamesData.json'.
     * 
     * Basically, it's just addSlideComponents(link, title, magnetlink, descC) but for single Game usage.
     */
    async function updateSingleGameUI() {
        try {
            // Read the JSON file containing game data
            const gameData = await primaryAPI.readFile('ftgGamesData.json', 'utf-8');

            console.log("Game Data: ", gameData)
            
            let scrapedGame = JSON.parse(gameData);
            console.log("Scraped Game: ", scrapedGame);

            var game = scrapedGame[0]; // Accessing the first (and presumably only) object in the array

            var title = game.title;
            var srcPic = game.img;
            var magnetLink = game.magnetlink[0];
            var desc = game.desc;
            var gameDesc = game.gameDesc;
            var gameScreenshots = game.gameScreenshots;


            console.log(`Processing game:\n ${title} with link \n${srcPic} and magnet link: \n${magnetLink} and description: \n${desc} and game description: \n${gameDesc} and game screenshots: \n${gameScreenshots}`);
            // Create elements to display game information
            const gameContainer = document.querySelector('.game-container');
            gameContainer.innerHTML = '';

            const contentContainer = document.createElement('div');
            contentContainer.className = 'content-container';

            const imgElement = document.createElement('img');
            imgElement.src = srcPic;
            imgElement.alt = title;
            imgElement.className = 'single-sliding-image';

          

            const downloadButton = document.createElement('button');
            downloadButton.className = 'download-button';
            downloadButton.textContent = 'Download';
       
            // Create a container for the game information (Genre, Size, etc.)
            const infoContainer = document.createElement('div');
            infoContainer.className = 'single-info-container';
            infoContainer.textContent = desc;

            // Create a container for the game screenshots
         

// Create a container for the game screenshots
const screenshotsContainer = document.createElement('div');
screenshotsContainer.className = 'single-screenshots-container';

// Iterate over each screenshot URL in the array and create an img element for it
gameScreenshots.forEach(screenshot => {
    const imgElement = document.createElement('img');
    imgElement.className = 'screenshot';
    imgElement.src = screenshot;
    screenshotsContainer.appendChild(imgElement);
});


            console.log("Game Screenshots: ", screenshotsContainer);
            console.log("Game Screenshots: ", screenshotsContainer.src);

            // Create a container for the game description
            const infoContainerGameDesc = document.createElement('div');
            infoContainerGameDesc.className = 'second-info-container';
           // infoContainerGameDesc.textContent = gameDesc;
           infoContainerGameDesc.textContent = "test";

            // Every element in the array will start with a new line for infoContainer
            //infoContainer.innerHTML = desc.map((desc) => `<p>${desc}</p>`).join('<br>');


            // Every element in the array will start with a new line
            infoContainerGameDesc.innerHTML = gameDesc.map((desc) => `<p>${desc}</p>`).join('<br>');

            // Create headings 

            ///TESTING GROUNDS ///// 

            const spoilerTab = document.createElement('button')
            spoilerTab.textContent = 'Show Spoiler';

            const hiddenGameDesc = document.createElement('div');
            hiddenGameDesc.className = 'hidden-game-desc';

            hiddenGameDesc.innerHTML = gameDesc.map((desc) => `<p>${desc}</p>`).join('<br>');
            hiddenGameDesc.style.display = 'none';



// Toggle visibility of the hidden content when the spoiler tab is clicked
spoilerTab.addEventListener('click', function() {
    if (hiddenGameDesc.style.display === 'none') {
        hiddenGameDesc.style.display = 'block';
        spoilerTab.textContent = 'Click to hide Game Description';
    } else {
        hiddenGameDesc.style.display = 'none';
        spoilerTab.textContent = 'Click to reveal Game Description';
    }
});

// log 
console.log("Game Description: ", hiddenGameDesc);
console.log("Game Description: ", spoilerTab);

            

            


            imgElement.addEventListener('contextmenu', async function(event) {
                event.preventDefault();
                let usablePathInstalled = await secondaryAPI.contextMenuLocalInstall(title, srcPic, desc);
            })

            
            primaryAPI.readFile(downloadedGames, 'utf8')
                .then(slideData => {
                    console.log("File data successfully read:", slideData);

                    let gameJSON = JSON.parse(slideData);
                    let forCheckTitle = title.trim()
                    try {
                        console.log(forCheckTitle);
                        var isUITorrentNameInJSON = gameJSON.games.includes(forCheckTitle);;
                    } catch (error) {
                        console.error("Error parsing JSON:", error);
                        return;
                    }
                    downloadButton.addEventListener('click', function() {
                        console.log('Download button clicked');
                    });
                    downloadButton.className = 'download-button';
                    if (isDownloading && sessionStorage.getItem('torrentCheckMagnet') === magnetLink) {
                        downloadButton.textContent = 'Stop Downloading';
                        downloadButton.className = 'stop-downloading-button';
                    } else if (!isDownloading && sessionStorage.getItem('torrentCheckMagnet') === magnetLink) {
                        downloadButton.textContent = 'Continue Download';
                        downloadButton.className = 'download-button';
                    } else if (isUITorrentNameInJSON) {
                        downloadButton.textContent = 'Install';
                    } else {
                        downloadButton.textContent = 'Download';
                        downloadButton.className = 'download-button';
                    };
                })
                .catch(error => {
                    console.error('Error reading file:', error);
                });

            
                const progressContainer = document.createElement('div');
                progressContainer.className = 'preprocess-info';
                progressContainer.innerHTML = `
                  <div class="single-torrent-details">
                    <div id="output" class="single-output"></div>
                    <div id="singleProgressBarContainer" class="progress-bar-container">
                      <div id="singleProgressBar" class="progress-bar"></div>
                    </div>
                    <div class="single-download-details">
                      <div class="row">
                      <span class="data pink-text" id="numPeers"></span>
                      </div>
                      <div class="row">
                      <span class="data pink-text" id="downloaded"></span>
                      </div>
                      <div class="row">
                      <span class="data pink-text" id="total"></span>
                      </div>
                      <div class="row">
                      <span class="data pink-text" id="remaining"></span>
                      </div>
                      <div class="row">
                      <span class="data pink-text" id="downloadSpeed"></span>
                      </div>
                      <div class="row">
                      <span class="data pink-text" id="uploadSpeed"></span>
                      </div>
                      <div class="row">
                      <span class="data pink-text" id="progress"></span>
                      </div>
                    </div>
                  </div>
                `;// Append progressContainer to the document or any specific element in the DOM
                document.body.appendChild(progressContainer); // You can replace document.body with another parent element
                

                // Change the text color to pink for the elements inside progressContainer
                const pinkTextElements = progressContainer.querySelectorAll('.pink-text');
                pinkTextElements.forEach(element => {
                element.style.color = 'pink';
            });




  
                
            // Append elements to the sliding window
            gameContainer.appendChild(contentContainer);
            contentContainer.appendChild(imgElement);
            contentContainer.appendChild(downloadButton);
            contentContainer.appendChild(screenshotsContainer)
                        // Append the spoiler tab and hidden content to the contentContainer
            contentContainer.appendChild(infoContainer);
            contentContainer.appendChild(spoilerTab); //test
contentContainer.appendChild(hiddenGameDesc);
            //contentContainer.appendChild(infoContainerGameDesc);
            contentContainer.appendChild(progressContainer);


            downloadButton.addEventListener('click', async function() {
                console.log("button clicked");
                if (!isDownloading) {
                    console.log("should NOT be destroying bbg")
                    console.log(magnetLink)
                    try {
                        let result = await togglePathWindowAsync(magnetLink, title, srcPic, desc, gameDesc, gameScreenshots);
                        if (result === false) {
                            console.log('User canceled the operation.');
                        } else {
                            console.log('User selected a path:', result.inputValue);
                            downloadButton.textContent = 'Stop Downloading';
                            downloadButton.className = 'stop-downloading-button';

                            isDownloading = true;
                        }
                    } catch (error) {
                        throw new Error(error)
                    }


                } else if (isDownloading) {
                    console.log("should be destroying bbg");
                    torrentAPI.stopTorrent();
                    stopUIUpdate();

                    downloadButton.textContent = "Download";
                    downloadButton.className = 'download-button';
                    console.log("clicked 1");

                    isDownloading = false;
                }

            });
        } catch (error) {
            console.error('Error updating game UI:', error);
        }
    }

    async function scrapePage(gameUrl) {
        // Implement your scraping logic here
        console.log("Scraping page: " + gameUrl);
        await window.scrapeAPI.scrapeDataGame(gameUrl)
        console.log('Scraping done!');
        await updateSingleGameUI()
    }

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        console.log(ScrapingUrl)
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    var urlParameter = getUrlParameter('url');
    if (urlParameter !== '') {
        // If a URL parameter is present, handle the message
        scrapePage(urlParameter);
    }

    /**Sets the data of the sending Torrent inside session storage for later purpose and usage by the UI process.
     */
    function updatingTorrent() {
        torrentAPI.on('updateInfo', (data) => {
            try {

                sessionStorage.setItem('isDone', data.torrentDone);
                sessionStorage.setItem('downloadSpeed', data.downloadSpeed);
                sessionStorage.setItem('uploadSpeed', data.uploadSpeed);
                sessionStorage.setItem('totalSize', data.total);
                sessionStorage.setItem('timeRemaining', data.remaining);
                sessionStorage.setItem('progressBar', data.progress);
                sessionStorage.setItem('downloadedSize', data.downloaded);
                sessionStorage.setItem('peers', data.numPeers);
                sessionStorage.setItem('torrentCheckMagnet', data.torrentMgn);
                sessionStorage.setItem('torrentFolderName', data.torrentName)


            } catch (error) {
                throw new Error(error);
            }
        });
    }




    /**
     * Asynchronous function to check game installation status and update game data inside the necessary json files.
     * I know it's inverted.
     * @param {string} myTitleGame The title of the game.
     * @param {string} imageGame The image of the game.
     * @param {string} descriptionGame The description of the game.
     * @param {stirng} gameDesc The game description.
     * @param {string} gameScreenshots The game screenshots.
     */

    async function checkInstallLib(imageGame, myTitleGame, descriptionGame, gameDesc, gameScreenshots) {
        try {
            const isGameDone = sessionStorage.getItem('isDone');
            myTitleGame = myTitleGame.replace(" [FitGirl Repack]", "");
            const gameDoneData = {
                games: []
            };
            let infoDownloadedGames = {};
    
            // Read existing gameDoneData if available
            const gameDoneDataStr = await primaryAPI.readFile(downloadedGames).catch(error => console.error("not existing"));
            if (gameDoneDataStr) {
                Object.assign(gameDoneData, JSON.parse(gameDoneDataStr));
            }
    
            // Read existing infoDownloadedGames if available
            const infoDownloadedGamesStr = await primaryAPI.readFile(infoDownloadedGamesFile);
            if (infoDownloadedGamesStr) {
                infoDownloadedGames = JSON.parse(infoDownloadedGamesStr);
            }
    
            const torrentGameName = sessionStorage.getItem('torrentFolderName');
            const isTorrentNameInJSON = gameDoneData.games.includes(myTitleGame);
    
            if (isTorrentNameInJSON || (isGameDone === 'true' && !isTorrentNameInJSON)) {
                console.log("Game is done. Stopping UI update, stopping torrent, and starting EXE processing.");
                stopUIUpdate();
                await torrentAPI.stopTorrent();
    
                if (!isTorrentNameInJSON) {
                    myTitleGame = myTitleGame.replace(" [FitGirl Repack]", "");
                    gameDoneData.games.push(myTitleGame);
                }
    
                infoDownloadedGames[myTitleGame] = {
                    title: myTitleGame,
                    image: imageGame,
                    description: descriptionGame,
                    gameDesc: gameDesc,
                    gameScreenshots: gameScreenshots,
                };
    
                const updatedJson = JSON.stringify(gameDoneData, null, 2);
                console.log(updatedJson)
                const infoDownloadedGamesJson = JSON.stringify(infoDownloadedGames, null, 2);
    
                await Promise.all([
                    primaryAPI.writeFile(downloadedGames, updatedJson, 'utf8'),
                    primaryAPI.writeFile(infoDownloadedGamesFile, infoDownloadedGamesJson, 'utf8')
                ]);
    
                console.log("hallo :", infoDownloadedGamesJson);
                startEXEProcessing();
            }
        } catch (error) {
            console.error('Error during game installation check:', error);
        }
    }

    /**
     * Modifies the visual data directly.
     * 
     * Should only be called via a new async function before calling it.
     * 
     * That means do not use it directly inside the togglePathWindow(someargs) .
     * 
     * And also I'm really lazy so I guess the single updateDownloadUI will work with this too <3.
     * 
     * I think <3.
     */
    async function updateDownloadUI(titleGame, imageGame, descriptionGame, gameDesc, gameScreenshots) {
        let downloadSpeed = sessionStorage.getItem('downloadSpeed');
        let uploadSpeed = sessionStorage.getItem('uploadSpeed');
        let totalSize = sessionStorage.getItem('totalSize');
        let timeRemaining = sessionStorage.getItem('timeRemaining');
        let progressBar = sessionStorage.getItem('progressBar');
        let downloadedSize = sessionStorage.getItem('downloadedSize');
        let peers = sessionStorage.getItem('peers');

        document.querySelector('#downloadSpeed').innerHTML = `Download Speed: ${downloadSpeed}`;
        document.querySelector('#uploadSpeed').innerHTML = `Upload Speed: ${uploadSpeed}`;
        document.querySelector('#total').innerHTML = `Total Downloaded : ${totalSize}`;
        document.querySelector('#remaining').innerHTML = `Time Remaining: ${timeRemaining}`;
        try {
            document.querySelector('#singleProgressBar').style.width = `${progressBar}`;
        } catch (error) {
            document.querySelector('#progressBar').style.width = `${progressBar}`;
        }
        document.querySelector('#downloaded').innerHTML = `Downloaded : ${downloadedSize}`;
        document.querySelector('#numPeers').innerHTML = `Peers : ${peers}`;

        checkInstallLib(titleGame, imageGame, descriptionGame, gameDesc, gameScreenshots);




    }
    async function startEXEProcessing() {
        let torrentFolderName = sessionStorage.getItem('torrentFolderName');
        let varActualInput = sessionStorage.getItem('actualPathInput');
        let gameFolderPathEXE = varActualInput + torrentFolderName + '/' + 'setup.exe';

        try {
            primaryAPI.executeBridgedFile(gameFolderPathEXE);
        } catch (error) {
            throw new Error("Error in Game Path",error);
        }
        await new Promise(r => setTimeout(r, 10000));
        console.log(autoInstallerPath);
        try {
            primaryAPI.executeBridgedFile(autoInstallerPath);
        } catch (error) {
            throw new Error(error)
        }

    }


    /**
     * Start "UI of downloading" update process.
     * //SECONDARY// PROCESS.
     */
    function startUIDownloadUpdate(titleGame, imageGame, descriptionGame) {
        if (!intervalId) {
            intervalId = setInterval(() => updateDownloadUI(titleGame, imageGame, descriptionGame), 505);
        }
    }



 /**
 * Toggles a path selection window asynchronously.
 * @param {string} magnetlink The magnet link.
 * @returns {Promise<boolean|{pathWindow: HTMLElement, inputValue: string}>} A promise resolving to either false if canceled or an object containing the path window element and the selected path.
 */
 async function togglePathWindowAsync(magnetlink, titleGame, imageGame, descriptionGame) {
    return new Promise(async resolve => {
        let pathWindow = document.createElement('div');
        pathWindow.className = 'pathWindow';
        pathWindow.style.position = 'fixed';
        pathWindow.style.top = '50%';
        pathWindow.style.left = '50%';
        pathWindow.style.transform = 'translate(-50%, -50%)';

        let pathInputLabel = document.createElement('label');
        pathInputLabel.className = 'pathLabel';
        pathInputLabel.textContent = 'Choose Install Location';
        pathWindow.appendChild(pathInputLabel);

        let pathInputContainer = document.createElement('div');
        pathInputContainer.className = 'pathInputContainer';
        pathWindow.appendChild(pathInputContainer);

        let pathInput = document.createElement('input');
        pathInput.id = 'pathID';
        pathInput.placeholder = 'Ex. C:\\Program Files';
        let lastInputPath = localStorage.getItem("lastPath");
        pathInput.value = lastInputPath;
        pathInputContainer.appendChild(pathInput);

        let folderInput = document.createElement('button');
        folderInput.textContent = 'Browse';
        folderInput.className = 'setting-btn';
        folderInput.addEventListener('click', async () => {
            try {
                console.log("start");
                let selectedFolder = await primaryAPI.openPathDir(); // Get the path of the selected folder
                console.log(selectedFolder);
                pathInput.value = selectedFolder;
            } catch (error) {
                throw new Error(error);
            }
        });
        pathInputContainer.appendChild(folderInput);

        let buttonContainer = document.createElement('div');
        buttonContainer.className = 'buttonContainer'; // Container for OK and Cancel buttons
        pathWindow.appendChild(buttonContainer);

        let okButton = document.createElement('button');
        okButton.textContent = 'Install';
        okButton.className = 'PathOkButton'; 
        okButton.addEventListener('click', async () => {
            let inputValue = pathInput.value;
            console.log('Entered value:', inputValue);
            pathWindow.remove();

            try {
                await window.torrentAPI.startTorrent(magnetlink, inputValue);
                updatingTorrent();
                startUIDownloadUpdate(titleGame, imageGame, descriptionGame);
            } catch (error) {
                console.error('Error initializing WebTorrent:', error);
            }

            resolve({
                pathWindow: pathWindow,
                inputValue: inputValue,
            });
        });
        buttonContainer.appendChild(okButton);

        let cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'PathCancelButton';
        cancelButton.addEventListener('click', () => {
            console.log("Canceled path selection.");
            pathWindow.remove();
            resolve(false);
        });
        buttonContainer.appendChild(cancelButton);

        pathInput.addEventListener('keyup', async (event) => {
            if (event.isComposing || event.key === "Enter") {
                let inputValue = pathInput.value;
                console.log('Entered value:', inputValue);
                pathWindow.remove();

                try {
                    await window.torrentAPI.startTorrent(magnetlink, inputValue);
                    updatingTorrent();
                    startUIDownloadUpdate(titleGame, imageGame, descriptionGame);
                } catch (error) {
                    console.error('Error initializing WebTorrent:', error);
                }

                resolve({
                    pathWindow: pathWindow,
                    inputValue: inputValue,
                });
            } else if (event.isComposing || event.key === "Escape") {
                console.log("escaped");
                pathWindow.remove();
                resolve(false);
            }
        });
        // sessionStorage.setItem("actualPathInput", pathInput.value)
        //     pathContainer.appendChild(pathInput);
        //     pathWindow.appendChild(pathContainer);
        //     pathWindow.appendChild(folderInput);
        //     pathContainer.appendChild(pathInputLabel);
        //     document.body.appendChild(pathWindow);

        document.body.appendChild(pathWindow);
        pathInput.focus(); // Set focus to the input field when the window opens
    });
}





    /**
     * Populates the image grid with game images.
     * @param {string[]} links Array of image links.
     * @param {string[]} magnetLinks Array of magnet links.
     * @param {Object[]} descsPer Array of description objects.
     * @param {Object[]} gameDescs Array of game description objects.
     * @param {Object[]} gameScreenshots Array of game screenshots objects.
     */
    function populateImageGrid() {
        console.log("start population")
        let gameGrid = document.querySelector('.game-grid');
        let fitgirlLauncher = document.querySelector('.game-container');

        function clearSearch() {
            var searchResultsElement = document.getElementById('search-results');
            searchResultsElement.innerHTML = '';
            searchResultsElement.style.display = 'none';
        }

        function showResults(query) {
            var xmlhttp = new XMLHttpRequest();
            var sitemapIndexURL = 'https://fitgirl-repacks.site/sitemap_index.xml';
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var xmlDoc = this.responseXML;
                    var sitemapURLs = [];
                    $(xmlDoc).find('sitemap').each(function() {
                        if (sitemapURLs.length < 5) {
                            var sitemapURL = $(this).find('loc').text();
                            sitemapURLs.push(sitemapURL);
                        }
                    });

                    var postURLs = [];
                    var requests = [];
                    sitemapURLs.forEach(function(sitemapURL) {
                        var request = $.get(sitemapURL, function(data) {
                            $(data).find('url').each(function() {
                                var postURL = $(this).find('loc').text();
                                postURLs.push(postURL);
                            });
                        });
                        requests.push(request);
                    });

                    $.when.apply($, requests).done(function() {
                        var results = postURLs.filter(function(postURL) {
                            return getTitleFromUrl(postURL).toUpperCase().replace(/-/g, ' ').includes(query.toUpperCase().trim());
                        });
                        displayResults(results.slice(0, 5));
                    });
                }
            };

            xmlhttp.open("GET", sitemapIndexURL, true);
            xmlhttp.send();
        }

        function displayResults(results) {
            var searchResultsElement = document.getElementById('search-results');
            searchResultsElement.innerHTML = '';

            if (results.length === 0) {
                searchResultsElement.style.display = 'none';
            } else {
                results.forEach(function(result) {
                    var resultElement = document.createElement('a');
                    resultElement.href = result;
                    resultElement.target = "_blank";
                    resultElement.textContent = capitalizeTitle(getTitleFromUrl(result));
                    resultElement.addEventListener('click', async function(event) {
                        event.preventDefault();
                        await scrapePage(result);
                        clearSearch();
                        searchInput.value = ''
                        //Place there the changing page.
                    });

                    searchResultsElement.appendChild(resultElement);
                });
                searchResultsElement.style.display = 'block';
            }
        }

        function capitalizeTitle(title) {
            return title.replace(/-/g, ' ').toUpperCase();
        }

        function getTitleFromUrl(url) {
            var parts = url.split("/");
            var title = parts[3];
            return title;
        }

        // Search functionality
        $('#searchInput').on('input', function() {

            var searchInput = document.getElementById('searchInput');
            var searchTerm = $(this).val().toLowerCase();
            if (searchInput.value !== '') {
                showResults(searchTerm);
            } else {
                clearSearch();
            }

        });


        /**
         * Toggles the sliding window visibility.
         */
        async function toggleSlidingWindow(linkO, titleO, magnetlinkO, descCO) {
            let slidingWindow = document.querySelector('.sliding-window');
            slidingWindow.style.transform = slidingWindow.style.transform === 'translateX(0)' ? 'translateX(100%)' : 'translateX(0)';
            await addSlideComponents(linkO, titleO, magnetlinkO, descCO);
            console.log("BYEEEEEEE POOKIE")
            if (slidingWindow.style.transform === 'translateX(0)') {
                return;
            }
        }

        /**
         * Adds components to the sliding window.
         * @param {string} link The image link.
         * @param {string} title The image title.
         * @param {string} magnetlink The magnet link.
         * @param {Object} descC The description Content object.
         * @param {Object} gameDesc The game description object.
         * @param {Object} gameScreenshots The game screenshots object.
         */
        async function addSlideComponents(link, title, magnetlink, descC, gameDesc, gameScreenshots) {
            console.log("HIIIIIIII POOKIE")
            let torrentedMagnet = sessionStorage.getItem('torrentCheckMagnet')
            let descsContent = descC;
            let gameDescContent = gameDesc;
            let slidingWindow = document.querySelector('.sliding-window');
            slidingWindow.innerHTML = '';
            let downloadButton = document.createElement('button');
            let contentContainer = document.createElement('div');
            contentContainer.className = 'content-container';

            let imgElement = document.createElement('img');
            imgElement.src = link;
            imgElement.alt = title;
            imgElement.className = 'sliding-image';

            console.log('>>>>>>>>>>>>>>>>Image link:', link);

            // Create a container for the game title
            let titleContainer = document.createElement('div');
            titleContainer.className = 'title-container';
            titleContainer.textContent = title;

            // Create a container for the game screenshots 
            let screenshotsContainer = document.createElement('div');
           // screenshotsContainer.className = 'screenshots-container';
            screenshotsContainer.textContent = gameScreenshots;

            // Create a container for the game information
            let infoContainer = document.createElement('div');
            infoContainer.className = 'info-container';
            infoContainer.textContent = descsContent;

            // Create a container for the game description
            let infoContainerGameDesc = document.createElement('div');
            infoContainerGameDesc.className = 'info-container';
            infoContainerGameDesc.textContent = gameDescContent;


            downloadButton.className = 'download-button';
            downloadButton.textContent = 'Download';



            primaryAPI.readFile(downloadedGames, 'utf8')
                .then(slideData => {
                    console.log("File data successfully read:", slideData);

                    let gameJSON = JSON.parse(slideData);
                    let forCheckTitle = title.trim()
                    try {
                        console.log(`Checking for ${forCheckTitle}`);
                    // Check if gameJSON.games is defined before accessing its properties
                    isUITorrentNameInJSON = gameJSON.games && gameJSON.games.includes(forCheckTitle); 
                    console.log("isUITorrentNameInJSON:", isUITorrentNameInJSON);
                        console.log("doe$zao");
                    } catch (error) {
                        console.error("Error parsing JSON:", error);
                    
                        return;
                    }

                    if (isDownloading && torrentedMagnet === magnetlink) {
                        downloadButton.textContent = 'Stop Downloading';
                        downloadButton.className = 'stop-downloading-button';
                    } else if (!isDownloading && torrentedMagnet === magnetlink) {
                        downloadButton.textContent = 'Continue Download';
                        downloadButton.className = 'download-button'
                    } else if (isUITorrentNameInJSON) {
                        downloadButton.textContent = 'Install';

                    } else {
                        downloadButton.textContent = 'Download';
                        downloadButton.className = 'download-button';
                    };
                })
                .catch(error => {
                    console.error('Error reading file:', error);
                });


                let progressContainer = document.createElement('div');
                progressContainer.className = 'preprocess-info';
                progressContainer.innerHTML = `
                  <div class="return-arrow-sld">
                    <svg fill="#D3337E" width="20px" height="20px" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" id="arrow">
                      <path d="M8.29289 2.29289C8.68342 1.90237 9.31658 1.90237 9.70711 2.29289L14.2071 6.79289C14.5976 7.18342 14.5976 7.81658 14.2071 8.20711L9.70711 12.7071C9.31658 13.0976 8.68342 13.0976 8.29289 12.7071C7.90237 12.3166 7.90237 11.6834 8.29289 11.2929L11 8.5H1.5C0.947715 8.5 0.5 8.05228 0.5 7.5C0.5 6.94772 0.947715 6.5 1.5 6.5H11L8.29289 3.70711C7.90237 3.31658 7.90237 2.68342 8.29289 2.29289Z"/>
                    </svg>
                  </div>
                  <div class="torrent-details">
                    <div id="output" class="output"></div>
                    <div id="progressBarContainer" class="progress-bar-container">
                      <div id="progressBar" class="progress-bar"></div>
                    </div>
                    <div class="download-details">
                      <div class="row">
                        <span class="data pink-text" id="numPeers"></span>
                      </div>
                      <div class="row">
                        <span class="data pink-text" id="downloaded"></span>
                      </div>
                      <div class="row">
                        <span class="data pink-text" id="total"></span>
                      </div>
                      <div class="row">
                        <span class="data pink-text" id="remaining"></span>
                      </div>
                      <div class="row">
                        <span class="data pink-text" id="downloadSpeed"></span>
                      </div>
                      <div class="row">
                        <span class="data pink-text" id="uploadSpeed"></span>
                      </div>
                      <div class="row">
                        <span class="data pink-text" id="progress"></span>
                      </div>
                    </div>
                  </div>
                `;

                // Change the text color to pink for the elements inside progressContainer
                const pinkTextElements = progressContainer.querySelectorAll('.pink-text');
                pinkTextElements.forEach(element => {
                element.style.color = 'pink';
            });
       
                
                


            slidingWindow.appendChild(contentContainer);
            contentContainer.appendChild(imgElement);
            contentContainer.appendChild(titleContainer);
            contentContainer.appendChild(downloadButton);
            contentContainer.appendChild(screenshotsContainer);
            contentContainer.appendChild(infoContainer);
            contentContainer.appendChild(progressContainer);

            const returnSlideArrow = document.querySelector('.return-arrow-sld');
            if (torrentedMagnet === magnetlink) {
                try {
                    startUIDownloadUpdate(title, link, descsContent, gameDescContent)
                } catch (error) {
                    throw new Error(error)
                }
            } else if (torrentedMagnet !== magnetlink) {
                try {
                    stopUIUpdate();

                } catch (error) {
                    new Error(error)
                }
            }
            console.log("State of Downloading Button : ", isDownloading);
            downloadButton.addEventListener('click', async function() {
                if (!isDownloading) {
                    console.log("should NOT be destroying bbg")

                    let result = await togglePathWindowAsync(magnetlink, link, title, descC);

                    if (result === false) {
                        console.log('User canceled the operation.');
                    } else {
                        console.log('User selected a path:', result.inputValue);
                        downloadButton.textContent = 'Stop Downloading';
                        downloadButton.className = 'stop-downloading-button';

                        isDownloading = true;
                    }
                } else if (isDownloading) {
                    console.log("should be destroying bbg");
                    window.torrentAPI.stopTorrent();
                    stopUIUpdate()
                    downloadButton.textContent = "Download";
                    downloadButton.className = 'download-button';

                    isDownloading = false;
                }

            });


            returnSlideArrow.addEventListener('click', function() {
                let slidingWindow = document.querySelector('.sliding-window');
                slidingWindow.style.transform = slidingWindow.style.transform === 'translateX(100%)' ? 'translateX(0)' : 'translateX(100%)';

                console.log('Sliding Game Window Closed');

            });
        }



        async function parseGameData() {
            // Read the contents of the games.json file
            const jsonData = await primaryAPI.readFile(myGamesFilePath, 'utf8');
          
            // Parse the JSON data into JavaScript objects
            const games = JSON.parse(jsonData);
          
            // Now you can work with the parsed data
            games.forEach((game, i) => {
                console.log("data searching")
                const title = game.title;
                const img = game.img;
                const desc = game.desc;
                const magnetlink = game.magnetlink;


                // Create elements for displaying game information
                const imageOption = document.createElement('div');
                imageOption.className = 'image-option';
                const imgElement = document.createElement('img');
                imgElement.src = img;
                console.log(`Loaded game title: ${title.slice(0, 15)}`);
               // console.log(img); //todo will clog console
                imgElement.alt = title;

                // Append image to imageOption
                imageOption.appendChild(imgElement);

                // Add event listener for mouseover
                imageOption.addEventListener('mouseover', () => {
                    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
                    const blurOverlay = document.createElement('div');
                    const colorBlurOverlay = document.createElement('div');
                    blurOverlay.classList.add('blur-overlay');
                    colorBlurOverlay.classList.add('color-blur-overlay');
                    fitgirlLauncher.appendChild(blurOverlay);
                    fitgirlLauncher.appendChild(colorBlurOverlay);
                    blurOverlay.style.backgroundColor = `rgb(0,0,0)`;
                    blurOverlay.style.backgroundImage = `url(${img})`;
                    blurOverlay.style.filter = 'blur(15px)';
                    blurOverlay.style.top = `-${scrollPosition}px`;
                });

                // Add event listener for context menu
                imageOption.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    secondaryAPI.contextMenuLocalInstall(title, img, desc);
                });

                // Add event listener for mouseout
                imageOption.addEventListener('mouseout', () => {
                    const blurOverlay = fitgirlLauncher.querySelector('.blur-overlay');
                    if (blurOverlay) {
                        blurOverlay.remove();
                    }
                });

                // Add event listener for click
                imageOption.addEventListener('click', () => {
                    console.log('Sliding Game Window Opened')
                    console.log('Clicked on game:', title.trim());
                    toggleSlidingWindow(img, title, magnetlink, desc); 
                    //todo: add screenshots and full description
                });

                // Append imageOption to gameGrid
                gameGrid.appendChild(imageOption);
            });
          }
        parseGameData()
    }

    populateImageGrid();
    console.log("end population")

});
