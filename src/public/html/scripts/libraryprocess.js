document.addEventListener('DOMContentLoaded', async function() {

    const {
        primaryAPI,
        secondaryAPI
    } = window;

    const dirname = await primaryAPI.getDirname();
    const downloadedGames = primaryAPI.resolvePath(dirname, '../../src/private/library/info_downloaded_games.json');

    /**
     * Populates the image grid of the library with game images.
     * @param {string[]} links Array of image links.
     * @param {string[]} magnetLinks Array of magnet links.
     * @param {Object[]} descsPer Array of description objects.
     */
    function populateImageGridLibrary() {
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

        primaryAPI.readFileSync(downloadedGames, 'utf-8')
        .then(data => {
            try {

              const gameData = JSON.parse(data);
              // Loop through each game title and its data
              for (const gameTitle in gameData) {
                if (gameData.hasOwnProperty(gameTitle)) {
                  const game = gameData[gameTitle];

                  let imageOption = document.createElement('div');
                  imageOption.className = 'image-option';

                  let imgElement = document.createElement('img');
                  imgElement.src = game.image;
                  imgElement.alt = game.title;
        
                  // Append img element to image option
                  
                  try {
                    imageOption.appendChild(imgElement);
                  } catch (error) {
                    throw new Error(error)
                  }
                  // Add mouseover event listener
                  imageOption.addEventListener('mouseover', function() {
                    let scrollPosition = window.scrollY || document.documentElement.scrollTop;
                    let blurOverlay = document.createElement('div');
                    let colorBlurOverlay = document.createElement('div');
                    blurOverlay.classList.add('blur-overlay');
                    colorBlurOverlay.classList.add('color-blur-overlay');
                    try {
                        fitgirlLauncher.appendChild(blurOverlay);
                        fitgirlLauncher.appendChild(colorBlurOverlay);
                    } catch (error) {
                      throw new Error(error)
                    }

        
                    blurOverlay.style.backgroundColor = `rgb(0,0,0)`;
                    blurOverlay.style.backgroundImage = `url(${game.image})`;
                    blurOverlay.style.filter = 'blur(15px)';
                    blurOverlay.style.top = `-${scrollPosition}px`;
                  });
        
                  // Add contextmenu event listener
                  imageOption.addEventListener('contextmenu', function(event){
                    event.preventDefault();
                    secondaryAPI.contextMenuGame();
                  });
        
                  // Add mouseout event listener
                  imageOption.addEventListener('mouseout', function() {
                    let blurOverlay = fitgirlLauncher.querySelector('.blur-overlay');
                    if (blurOverlay) {
                      blurOverlay.remove();
                    }
                  });
        
                  // Add click event listener
                  imageOption.addEventListener('click', function() {
                    console.log("Selected image link: " + game.image);
                    console.log('Title:', game.title);
                    console.log('Description:', game.description);
                    console.log('Info:', game.description.info);
                  });
        
                  // Append image option to gameGrid
                  
                  try {
                    gameGrid.appendChild(imageOption);
                  } catch (error) {
                    throw new Error(error)
                  }
                }
              }
            } catch (error) {
              console.error('Error parsing the JSON:', error.message);
            }
          })
          .catch(error => {
            console.error('Error reading the file:', error);
          });



    }    
    populateImageGridLibrary();
});

