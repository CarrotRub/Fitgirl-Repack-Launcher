document.addEventListener('DOMContentLoaded', async function() {


    const {
        torrentAPI,
        primaryAPI
    } = window;
    const dirname = await primaryAPI.getDirname();

    // Start from HTML.
    const titlesPath = primaryAPI.resolvePath(dirname, '../../src/private/temp/titles.tmp');
    const picTempPath = primaryAPI.resolvePath(dirname, '../../src/private/temp/pic.tmp');
    const magnetPath = primaryAPI.resolvePath(dirname, '../../src/private/temp/magnet_links.tmp');
    const descsPath = primaryAPI.resolvePath(dirname, '../../src/private/temp/descs.json');
    const dwnldGames = primaryAPI.resolvePath(dirname, '../../src/private/games/dwnld.json');
    const autoInstallerPath = primaryAPI.resolvePath(dirname, '../public/apps/bin/installer.exe');

    let intervalId = null;

    var isDownloading = false;
    var ScrapingUrl = getUrlParameter('url');



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
            const gameData = await primaryAPI.readFileSync('ftgGamesData.json', 'utf-8');

            // Parse the JSON data
            const {
                titles,
                srcPics,
                magnetLinks,
                descs
            } = JSON.parse(gameData);

            // Assuming there's only one game's data in the file
            const title = titles[0];
            const srcPic = srcPics[0];
            const magnetLink = magnetLinks[0];
            const desc = descs[0].info;

            // Create elements to display game information
            const gameContainer = document.querySelector('.game-container');
            gameContainer.innerHTML = '';

            const contentContainer = document.createElement('div');
            contentContainer.className = 'content-container';

            const imgElement = document.createElement('img');
            imgElement.src = srcPic;
            imgElement.alt = title;
            imgElement.className = 'single-sliding-image';

            const infoContainer = document.createElement('div');
            infoContainer.className = 'single-info-container';
            infoContainer.textContent = desc;

            const downloadButton = document.createElement('button');

            if (isDownloading && sessionStorage.getItem('torrentCheckMagnet') === magnetLink) {
                downloadButton.textContent = 'Stop Downloading';
            } else if (!isDownloading && sessionStorage.getItem('torrentCheckMagnet') === magnetLink) {
                downloadButton.textContent = 'Continue Download';
            } else {
                downloadButton.textContent = 'Download';
            }
            downloadButton.className = 'download-button';

            const progressContainer = document.createElement('div');
            progressContainer.className = 'preprocess-info';
            progressContainer.innerHTML = `
                <div class="single-torrent-details">
                    <div id="output" class="single-output"></div>
                    <div id="singleProgressBarContainer" class="progress-bar-container">
                        <div id="singleProgressBar" class="progress-bar"></div>
                    </div>
                    <div class="single-download-details">
                        <span id="numPeers"></span>
                        <span id="downloaded"></span>
                        <span id="total"></span>
                        <span id="remaining"></span>
                        <span id="downloadSpeed"></span>
                        <span id="uploadSpeed"></span>
                        <span id="progress"></span>
                    </div>
                </div>
            `;

            // Append elements to the sliding window
            gameContainer.appendChild(contentContainer);
            contentContainer.appendChild(imgElement);
            contentContainer.appendChild(infoContainer);
            contentContainer.appendChild(downloadButton);
            contentContainer.appendChild(progressContainer);


            downloadButton.addEventListener('click', async function() {
                if (!isDownloading) {
                    console.log("should NOT be destroying bbg")
                    console.log(magnetLink)
                    try {
                        let result = await togglePathWindowAsync(magnetLink);
                        if (result === false) {
                            console.log('User canceled the operation.');
                        } else {
                            console.log('User selected a path:', result.inputValue);
                            downloadButton.textContent = 'Stop Downloading';
                            downloadButton.className = 'downloading-button';

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
        console.log("is done probably")
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
        console.log("should")
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
    async function updateDownloadUI() {
        let downloadSpeed = sessionStorage.getItem('downloadSpeed');
        let uploadSpeed = sessionStorage.getItem('uploadSpeed');
        let totalSize = sessionStorage.getItem('totalSize');
        let timeRemaining = sessionStorage.getItem('timeRemaining');
        let progressBar = sessionStorage.getItem('progressBar');
        let downloadedSize = sessionStorage.getItem('downloadedSize');
        let peers = sessionStorage.getItem('peers');
        let isGameDone = sessionStorage.getItem('isDone');

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

        primaryAPI.readFile(dwnldGames)
            .then(async (gameDoneData) => {
                try {
                    // Parse the JSON data
                    const jsonData = JSON.parse(gameDoneData);
                    var torrentGameName = sessionStorage.getItem('torrentFolderName');

                    // Check if torrentName is in jsonData
                    const isTorrentNameInJSON = jsonData.games.includes(torrentGameName);

                    if (isTorrentNameInJSON) {
                        console.log("Game is done. Stopping UI update, stopping torrent, and starting EXE processing.");
                        stopUIUpdate();
                        torrentAPI.stopTorrent();

                        await startEXEProcessing();
                    } else if (isGameDone === 'true') {
                        console.log("Game is done. Stopping UI update, stopping torrent, and starting EXE processing.");

                        stopUIUpdate();

                        torrentAPI.stopTorrent();


                        jsonData.games.push(torrentGameName);

                        // Convert the updated JSON data back to a string
                        const updatedJson = JSON.stringify(jsonData, null, 2);
                        await startEXEProcessing();

                        // Write the updated JSON back to the file
                        return primaryAPI.writeFile(dwnldGames, updatedJson, 'utf8');
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            })
            .then(() => {
                console.log('JSON file updated successfully.');

            })
            .catch((err) => {
                console.error('Error reading or writing JSON file:', err);
            });



    }

    async function startEXEProcessing() {
        let torrentFolderName = sessionStorage.getItem('torrentFolderName');
        let varActualInput = sessionStorage.getItem('actualPathInput');
        let gameFolderPathEXE = varActualInput + torrentFolderName + '/' + 'setup.exe';

        primaryAPI.executeBridgedFile(gameFolderPathEXE);
        await new Promise(r => setTimeout(r, 10000));
        console.log(autoInstallerPath);
        primaryAPI.executeBridgedFile(autoInstallerPath);

    }


    /**
     * Start "UI of downloading" update process.
     * //SECONDARY// PROCESS.
     */
    async function startUIDownloadUpdate() {
        if (!intervalId) {
            intervalId = setInterval(updateDownloadUI, 501);

        }
    }

    /**
     * Stop UI update process. 
     * 
     * (Usually at the changing of a new window)
     */
    async function stopUIUpdate() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    /**
     * Toggles a path selection window asynchronously.
     * @param {string} magnetlink The magnet link.
     * @returns {Promise<boolean|{pathWindow: HTMLElement, inputValue: string}>} A promise resolving to either false if canceled or an object containing the path window element and the selected path.
     */
    async function togglePathWindowAsync(magnetlink) {
        return new Promise(async resolve => {
            let pathWindow = document.createElement('div');
            pathWindow.className = 'pathWindow';
            pathWindow.style.position = 'fixed';
            pathWindow.style.top = '50%';
            pathWindow.style.left = '50%';
            pathWindow.style.transform = 'translate(-50%, -50%)';

            let pathContainer = document.createElement('div');
            let pathInput = document.createElement('input');
            pathInput.id = 'pathID';
            let lastInputPath = localStorage.getItem("lastPath");
            pathInput.value = lastInputPath;

            pathWindow.addEventListener('keyup', function(event) {
                if (event.isComposing || event.key === "Escape") {
                    console.log("escaped");
                    pathWindow.remove();
                    resolve(false);
                }
            });

            pathInput.addEventListener('keyup', async function(event) {
                if (event.isComposing || event.key === "Enter") {
                    let inputValue = pathInput.value;
                    console.log('Entered value:', inputValue);
                    pathWindow.remove();
                    console.log(magnetlink);

                    // Call startTorrent to start the webtorrent client and open the channel for sending the data
                    try {

                        await window.torrentAPI.startTorrent(magnetlink, inputValue);

                        // Place the data on Interval inside the sessionStorage.

                        updatingTorrent();
                        try {

                            await startUIDownloadUpdate()

                        } catch (error) {
                            throw new Error(error)
                        }

                    } catch (error) {
                        console.error('Error initializing WebTorrent:', error);
                    }

                    resolve({
                        pathWindow: pathWindow,
                        inputValue: pathInput.value,

                    });

                } else if (event.isComposing || event.key === "Escape") {
                    console.log("escaped");
                    pathWindow.remove();
                    resolve(false);
                }
            });
            sessionStorage.setItem("actualPathInput", pathInput.value)
            pathContainer.appendChild(pathInput);
            pathWindow.appendChild(pathContainer);

            document.body.appendChild(pathWindow);

        });
    }

    /**
     * Populates the image grid with game images.
     * @param {string[]} links Array of image links.
     * @param {string[]} magnetLinks Array of magnet links.
     * @param {Object[]} descsPer Array of description objects.
     */
    function populateImageGrid(links, magnetLinks, descsPer) {
        let gameGrid = document.querySelector('.game-grid');
        let fitgirlLauncher = document.querySelector('.game-container');
        let imageLinks = links;



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
         */
        async function addSlideComponents(link, title, magnetlink, descC) {
            console.log("HIIIIIIII POOKIE")
            let torrentedMagnet = sessionStorage.getItem('torrentCheckMagnet')
            let descsContent = descC;
            let slidingWindow = document.querySelector('.sliding-window');
            slidingWindow.innerHTML = '';

            let contentContainer = document.createElement('div');
            contentContainer.className = 'content-container';

            let imgElement = document.createElement('img');
            imgElement.src = link;
            imgElement.alt = title;
            imgElement.className = 'sliding-image';

            let infoContainer = document.createElement('div');
            infoContainer.className = 'info-container';
            infoContainer.textContent = descsContent.info;

            let downloadButton = document.createElement('button');
            if (isDownloading && torrentedMagnet === magnetlink) {
                downloadButton.textContent = 'Stop Downloading';
            } else if (!isDownloading && torrentedMagnet === magnetlink) {
                downloadButton.textContent = 'Continue Download';
            } else {
                downloadButton.textContent = 'Download';
            }
            downloadButton.className = 'download-button';

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
                  <span id="numPeers"></span>
                  <span id="downloaded"></span>
                  <span id="total"></span>
                  <span id="remaining"></span>
                  <span id="downloadSpeed"></span>
                  <span id="uploadSpeed"></span>
                  <span id="progress"></span>
                </div>
              </div>
            `;



            slidingWindow.appendChild(contentContainer);
            contentContainer.appendChild(imgElement);
            contentContainer.appendChild(infoContainer);
            contentContainer.appendChild(downloadButton);
            contentContainer.appendChild(progressContainer);

            const returnSlideArrow = document.querySelector('.return-arrow-sld');
            if (torrentedMagnet === magnetlink) {
                try {
                    await startUIDownloadUpdate()
                } catch (error) {
                    throw new Error(error)
                }
            } else if (torrentedMagnet !== magnetlink) {
                try {
                    await stopUIUpdate()
                } catch (error) {
                    new Error(error)
                }
            }
            console.log("State of Downloading Button : ", isDownloading);
            downloadButton.addEventListener('click', async function() {
                if (!isDownloading) {
                    console.log("should NOT be destroying bbg")

                    let result = await togglePathWindowAsync(magnetlink);

                    if (result === false) {
                        console.log('User canceled the operation.');
                    } else {
                        console.log('User selected a path:', result.inputValue);
                        downloadButton.textContent = 'Stop Downloading';
                        downloadButton.className = 'downloading-button';

                        isDownloading = true;
                    }
                } else if (isDownloading) {
                    console.log("should be destroying bbg");
                    window.torrentAPI.stopTorrent();
                    downloadButton.textContent = "Download";

                    isDownloading = false;
                }

            });


            returnSlideArrow.addEventListener('click', function() {
                let slidingWindow = document.querySelector('.sliding-window');
                slidingWindow.style.transform = slidingWindow.style.transform === 'translateX(100%)' ? 'translateX(0)' : 'translateX(100%)';

            });
        }

        primaryAPI.readLinesFromFile(titlesPath)
            .then((gameTitles) => {
                imageLinks.forEach(function(link, index) {
                    let imageOption = document.createElement('div');
                    imageOption.className = 'image-option';
                    let imageStar = document.createElement('div');
                    imageStar.className = 'star'
                    let imageStarIcon = document.createElement('div');
                    imageStarIcon.className = 'star-icon';

                    let imgElement = document.createElement('img');
                    imgElement.src = link;
                    imgElement.alt = gameTitles[index];

                    imageOption.appendChild(imgElement);
                    imageOption.addEventListener('mouseover', function() {
                        let scrollPosition = window.scrollY || document.documentElement.scrollTop;
                        let blurOverlay = document.createElement('div');
                        let colorBlurOverlay = document.createElement('div');
                        blurOverlay.classList.add('blur-overlay');
                        colorBlurOverlay.classList.add('color-blur-overlay'); //possibly useless, I don't remember anymore.
                        fitgirlLauncher.appendChild(blurOverlay);
                        fitgirlLauncher.appendChild(colorBlurOverlay);

                        blurOverlay.style.backgroundColor = `rgb(0,0,0)`;
                        blurOverlay.style.backgroundImage = `url(${link})`;
                        blurOverlay.style.filter = 'blur(15px)';
                        blurOverlay.style.top = `-${scrollPosition}px`;
                    });

                    imageOption.addEventListener('mouseout', function() {
                        let blurOverlay = fitgirlLauncher.querySelector('.blur-overlay');
                        if (blurOverlay) {
                            blurOverlay.remove();
                        }
                    });

                    imageOption.addEventListener('click', function() {
                        console.log("Selected image link: " + link);

                        primaryAPI.readFileSync(descsPath, 'utf-8')
                            .then((content) => {

                                try {
                                    content = JSON.parse(content);
                                    toggleSlidingWindow(link, gameTitles[index], magnetLinks[index], content[index]);

                                } catch (error) {
                                    console.error('Error parsing the JSON:', error.message);
                                }
                            })
                        // addSlideComponents(link, gameTitles[index], magnetLinks[index], descsPath[index] );
                    });

                    gameGrid.appendChild(imageOption);
                });

            })
            .catch((error) => {
                console.error('Error reading the file:', error);
            })
    }


    // Call the function to get magnet links
    primaryAPI.readLinesFromFile(magnetPath)
        .then((magnetLinks) => {

            // Call the function to get image links
            primaryAPI.readLinesFromFile(picTempPath)
                .then((lines) => {

                    // Resolve the promise and parse content as JSON
                    primaryAPI.readFileSync(descsPath, 'utf-8')
                        .then((content) => {
                            try {
                                // Parse content as JSON
                                content = JSON.parse(content);

                                populateImageGrid(lines, magnetLinks, content);
                            } catch (error) {
                                console.error('Error parsing the JSON:', error.message);
                            }
                        })
                        .catch((error) => {
                            console.error('Error reading the file:', error.message);
                        });
                })
                .catch((error) => {
                    console.error('Error reading the file:', error);
                });
        })
        .catch((error) => {
            console.error('Error reading magnet links:', error);
        });

});
