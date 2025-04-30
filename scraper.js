const bandcamp = require('bandcamp-scraper');
const fs = require('fs');

const artistUrl = 'https://kinked.bandcamp.com';

async function scrape() {
  try {
    // Get artist info
    const artistInfo = await new Promise((resolve, reject) => {
      bandcamp.getArtistInfo(artistUrl, (err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });
    
    // Get album URLs
    const albumUrls = await new Promise((resolve, reject) => {
      bandcamp.getAlbumUrls(artistUrl, (err, urls) => {
        if (err) reject(err);
        else resolve(urls);
      });
    });
    
    // Get album info for each album
    const albums = await Promise.all(
      albumUrls.map(url => 
        new Promise((resolve, reject) => {
          bandcamp.getAlbumInfo(url, (err, info) => {
            if (err) reject(err);
            else resolve(info);
          });
        })
      )
    );
    
    // Save data to JSON file
    const data = {
      artist: artistInfo,
      albums: albums
    };
    
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    
    // Generate HTML
    generateHtml(data);
    
    console.log('Scrape complete!');
  } catch (error) {
    console.error('Error scraping Bandcamp:', error);
  }
}

function generateHtml(data) {
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.artist.name}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>${data.artist.name}</h1>
    <p>${data.artist.description || ''}</p>
  </header>
  
  <main>
    <section class="albums">
`;

  data.albums.forEach(album => {
    html += `
      <article class="album">
        <img src="${album.imageUrl}" alt="${album.title}">
        <h2>${album.title}</h2>
        <p class="release-date">Released: ${album.releaseDate || 'Unknown'}</p>
        <ul class="tracks">
    `;
    
    album.tracks.forEach(track => {
      html += `
          <li class="track">
            <span class="track-number">${track.number}.</span>
            <span class="track-title">${track.name}</span>
            <span class="track-duration">${track.duration || ''}</span>
          </li>
      `;
    });
    
    html += `
        </ul>
        <a href="${album.url}" target="_blank" class="album-link">View on Bandcamp</a>
      </article>
    `;
  });

  html += `
    </section>
  </main>
  
  <footer>
    <p>Data from <a href="${artistUrl}" target="_blank">Bandcamp</a></p>
  </footer>
</body>
</html>
  `;
  
  fs.writeFileSync('index.html', html);
}

scrape(); 