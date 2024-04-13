const { getGamesData } = require('./singlescrap');

// Now you can use getGamesData function
const url = `https://fitgirl-repacks.site/skul-the-hero-slayer/`;
getGamesData(url)
  .then(data => {
    // Do something with the data
    console.log(data);
  })
  .catch(error => {
    console.error(error);
  });