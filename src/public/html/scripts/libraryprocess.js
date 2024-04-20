document.addEventListener('DOMContentLoaded', async function() {

  const {
      primaryAPI,
      secondaryAPI
  } = window;

  const dirname = await primaryAPI.getDirname();

  const downloadedGames = primaryAPI.resolvePath(dirname, '../../src/private/library/info_downloaded_games.json');
  const installedLocallyGamesPath = primaryAPI.resolvePath(dirname, '../../src/private/library/locally_installed_games.json')


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



      async function addSlideComponents(title,link,descC, pathExecutable) {
        let descsContent = descC;
        let slidingWindow = document.querySelector('.sliding-window');
        slidingWindow.innerHTML = '';
        let contentContainer = document.createElement('div');
        contentContainer.className = 'content-container';

        let imgElement = document.createElement('img');
        imgElement.src = link;
        imgElement.alt = title;
        imgElement.className = 'sliding-image';
        let progressContainer = document.createElement('div');
        progressContainer.className = 'preprocess-info';
        progressContainer.innerHTML = `
          <div class="return-arrow-sld">
            <svg fill="#D3337E" width="20px" height="20px" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" id="arrow">
              <path d="M8.29289 2.29289C8.68342 1.90237 9.31658 1.90237 9.70711 2.29289L14.2071 6.79289C14.5976 7.18342 14.5976 7.81658 14.2071 8.20711L9.70711 12.7071C9.31658 13.0976 8.68342 13.0976 8.29289 12.7071C7.90237 12.3166 7.90237 11.6834 8.29289 11.2929L11 8.5H1.5C0.947715 8.5 0.5 8.05228 0.5 7.5C0.5 6.94772 0.947715 6.5 1.5 6.5H11L8.29289 3.70711C7.90237 3.31658 7.90237 2.68342 8.29289 2.29289Z"/>
            </svg>
          </div>
          `
        let infoContainer = document.createElement('div');
        infoContainer.className = 'info-container';
        infoContainer.textContent = descsContent.info;

        let startButton = document.createElement('button');
        startButton.className = 'start-button';
        startButton.textContent = 'Start Game';

        startButton.addEventListener('click', async function() {
          primaryAPI.spawnBridgedFile(pathExecutable)
        });

        slidingWindow.appendChild(contentContainer);
        contentContainer.appendChild(imgElement);
        contentContainer.appendChild(infoContainer);
        contentContainer.appendChild(startButton);
        contentContainer.appendChild(progressContainer);
        const returnSlideArrow = document.querySelector('.return-arrow-sld');


        returnSlideArrow.addEventListener('click', function() {
            let slidingWindow = document.querySelector('.sliding-window');
            slidingWindow.style.transform = slidingWindow.style.transform === 'translateX(100%)' ? 'translateX(0)' : 'translateX(100%)';
            
        // Close file explorer if open TODO:does not work :(, fix it)
        let fileExplorer = document.querySelector('.file-explorer');
        if (fileExplorer) {
            fileExplorer.style.display = 'none';
        }    


       
        }
    );
    
    }

      async function toggleSlidingWindow(titleO,linkO,descCO, pathExecutableO ) {
        let slidingWindow = document.querySelector('.sliding-window');
        slidingWindow.style.transform = slidingWindow.style.transform === 'translateX(0)' ? 'translateX(100%)' : 'translateX(0)';
        await addSlideComponents(titleO,linkO,descCO, pathExecutableO);
        console.log("BYEEEEEEE POOKIE")
        if (slidingWindow.style.transform === 'translateX(0)') {
            return;
        }
    }
      /**
       * Games that are downloaded only, if possible add a marker to them.
       */
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
                          imageOption.innerHTML = `<svg width="30px" height="30px" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>error-filled</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="add" fill="#ff0000" transform="translate(42.666667, 42.666667)"> <path d="M213.333333,3.55271368e-14 C331.136,3.55271368e-14 426.666667,95.5306667 426.666667,213.333333 C426.666667,331.136 331.136,426.666667 213.333333,426.666667 C95.5306667,426.666667 3.55271368e-14,331.136 3.55271368e-14,213.333333 C3.55271368e-14,95.5306667 95.5306667,3.55271368e-14 213.333333,3.55271368e-14 Z M262.250667,134.250667 L213.333333,183.168 L164.416,134.250667 L134.250667,164.416 L183.168,213.333333 L134.250667,262.250667 L164.416,292.416 L213.333333,243.498667 L262.250667,292.416 L292.416,262.250667 L243.498667,213.333333 L292.416,164.416 L262.250667,134.250667 Z" id="Combined-Shape"> </path> </g> </g> </g></svg>`

                          let imgElement = document.createElement('img');
                          imgElement.src = game.image;
                          imgElement.alt = game.title;

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
                          imageOption.addEventListener('contextmenu', async function(event) {
                            event.preventDefault();
                            await secondaryAPI.contextMenuLocalInstall(game.title, game.image, game.description.info);
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

      /**
       * Games that are installed.
       */
      primaryAPI.readFileSync(installedLocallyGamesPath, 'utf-8')
          .then(data => {
              try {

                  const gameData = JSON.parse(data);
                  // Loop through each game title and its data
                  for (const gameTitle in gameData) {
                      if (gameData.hasOwnProperty(gameTitle)) {
                          const game = gameData[gameTitle];

                          let imageOption = document.createElement('div');
                          imageOption.className = 'image-option';
                          imageOption.innerHTML = `<svg width="30px" height="30px" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>success-filled</title> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="add-copy-2" fill="#0fff00" transform="translate(42.666667, 42.666667)"> <path d="M213.333333,3.55271368e-14 C95.51296,3.55271368e-14 3.55271368e-14,95.51296 3.55271368e-14,213.333333 C3.55271368e-14,331.153707 95.51296,426.666667 213.333333,426.666667 C331.153707,426.666667 426.666667,331.153707 426.666667,213.333333 C426.666667,95.51296 331.153707,3.55271368e-14 213.333333,3.55271368e-14 Z M293.669333,137.114453 L323.835947,167.281067 L192,299.66912 L112.916693,220.585813 L143.083307,190.4192 L192,239.335893 L293.669333,137.114453 Z" id="Shape"> </path> </g> </g> </g></svg>`
                          let imgElement = document.createElement('img');
                          imgElement.src = game.image;
                          imgElement.alt = gameTitle;


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
                          imageOption.addEventListener('contextmenu', function(event) {
                              event.preventDefault();
                              secondaryAPI.contextMenuGame();
                          });

                          imageOption.addEventListener('mouseout', function() {
                              let blurOverlay = fitgirlLauncher.querySelector('.blur-overlay');
                              if (blurOverlay) {
                                  blurOverlay.remove();
                              }
                          });


                          imageOption.addEventListener('click', function() {
                            toggleSlidingWindow(gameTitle, game.image, game.description, game.path)
                          });


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
