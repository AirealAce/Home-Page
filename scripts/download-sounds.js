const https = require('https');
const fs = require('fs');
const path = require('path');

const sounds = [
  {
    name: 'hover.mp3',
    url: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
  },
  {
    name: 'click.mp3',
    url: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3'
  },
  {
    name: 'focus.mp3',
    url: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'
  },
  {
    name: 'success.mp3',
    url: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3'
  }
];

const soundsDir = path.join(__dirname, '../public/sounds');

// Create sounds directory if it doesn't exist
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Download each sound
sounds.forEach(sound => {
  const file = fs.createWriteStream(path.join(soundsDir, sound.name));
  https.get(sound.url, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${sound.name}`);
    });
  }).on('error', err => {
    fs.unlink(path.join(soundsDir, sound.name));
    console.error(`Error downloading ${sound.name}:`, err.message);
  });
}); 