let path = require('path'),
  StreamDeck = require('elgato-stream-deck'),
  cp = require('child_process'),
  opn = require('opn'),
  ks = require('node-key-sender'),
  ha = require('./common/ha'),
  image = require('./common/image'),
  moment = require('moment'),
  PAGE_MAIN = 'main',
  PAGE_HA = 'home_assistant',
  PAGE_SETTINGS = 'settings',
  BRIGHTNESS = 50,
  lastPage = PAGE_MAIN,
  currPage = PAGE_MAIN,
  timeouts = [];

getResource = filePath => path.resolve(__dirname, `resources/${filePath}`);


setTempImageAndDelete = (key, filePath) => {
  streamDeck.fillImageFromFile(key, filePath);
  setTimeout(() => cp.exec(`rm ${filePath}`), 2000);
};

updateBrightness = () => {
  if (BRIGHTNESS > 100) BRIGHTNESS = 100;
  if (BRIGHTNESS < 0) BRIGHTNESS = 0;
  streamDeck.setBrightness(BRIGHTNESS);
  timeouts.push(image.addText(
    getResource('images/brightness-down.png'),
    BRIGHTNESS.toString(),
    false,
    filePath => setTempImageAndDelete(3, filePath)
  ));
  timeouts.push(image.addText(
    getResource('images/brightness-up.png'),
    BRIGHTNESS.toString(),
    false,
    filePath => setTempImageAndDelete(2, filePath)
  ));
};

createPage = page => {
  lastPage = currPage;
  for (let i = 0; i <= 10; i++)streamDeck.clearKey(i);
  switch (page) {
    case PAGE_MAIN:
      // Row 1
      streamDeck.fillImageFromFile(4, getResource('images/ha.png'));
      streamDeck.fillImageFromFile(3, getResource('images/discord.png'));
      streamDeck.fillImageFromFile(2, getResource('images/spotify.png'));
      streamDeck.fillImageFromFile(1, getResource('images/github.png'));
      streamDeck.fillImageFromFile(0, getResource('images/gitlab.png'));
      // Row 2
      streamDeck.fillImageFromFile(9, getResource('images/vol-down.png'));
      streamDeck.fillImageFromFile(8, getResource('images/skip-previous.png'));
      streamDeck.fillImageFromFile(7, getResource('images/play.png'));
      streamDeck.fillImageFromFile(6, getResource('images/skip-next.png'));
      streamDeck.fillImageFromFile(5, getResource('images/vol-up.png'));
      // Row 3
      setInterval(() => {
        let blank = getResource('images/blank.png'),
          time = moment();

        image.addText(blank, time.format('HH'), true, filePath =>
          setTempImageAndDelete(14, filePath)
        );
        image.addText(blank, time.format('mm'), true, filePath =>
          setTempImageAndDelete(13, filePath)
        );
        image.addText(blank, time.format('dd'), true, filePath =>
          setTempImageAndDelete(12, filePath)
        );
        image.addText(blank, time.format('DD'), true, filePath =>
          setTempImageAndDelete(11, filePath)
        );
      }, 1000);
      streamDeck.fillImageFromFile(10, getResource('images/settings.png'));
      break;
    case PAGE_HA:
      // Row 1
      streamDeck.fillImageFromFile(4, getResource('images/back.png'));
      streamDeck.fillImageFromFile(3, getResource('images/ha-reset.png'));
      streamDeck.fillImageFromFile(2, getResource('images/ha-night.png'));
      // streamDeck.fillImageFromFile(1, getResource('images/ha.png'));
      // streamDeck.fillImageFromFile(0, getResource('images/ha.png'));
      break;
    case PAGE_SETTINGS:
      // Row 1
      streamDeck.fillImageFromFile(4, getResource('images/back.png'));
      streamDeck.fillImageFromFile(3, getResource('images/brightness-down.png'));
      streamDeck.fillImageFromFile(2, getResource('images/brightness-up.png'));
      break;
  }
  currPage = page;
};

handleKeyPressed = key => {
  // Clear any timeouts
  timeouts.map(id => clearTimeout(id));
  switch (key) {
    case 4:
      switch (currPage) {
        case PAGE_MAIN:
          return createPage(PAGE_HA);
        default:
          return createPage(lastPage);
      }
    case 3:
      switch (currPage) {
        case PAGE_MAIN:
          return cp.exec('discord');
        case PAGE_HA:
          return ha.call('scene', 'turn_on', 'scene.reset_lights');
        case PAGE_SETTINGS:
          BRIGHTNESS -= 5;
          return updateBrightness();
      }
    case 2:
      switch (currPage) {
        case PAGE_MAIN:
          return cp.exec('spotify');
        case PAGE_HA:
          return ha.call('scene', 'turn_on', 'scene.night_mode');
        case PAGE_SETTINGS:
          BRIGHTNESS += 5;
          return updateBrightness();
      }
    case 1:
      switch (currPage) {
        case PAGE_MAIN:
          return opn('https://github.com');
      }
    case 0:
      switch (currPage) {
        case PAGE_MAIN:
          return opn('https://gitlab.com');
      }
    case 9:
      switch (currPage) {
        case PAGE_MAIN:
          return ks.sendKey('');
      }
    case 8:
      switch (currPage) {
        case PAGE_MAIN:
          return ks.sendKey('');
      }
    case 7:
      switch (currPage) {
        case PAGE_MAIN:
          return ks.sendKey('');
      }
    case 6:
      switch (currPage) {
        case PAGE_MAIN:
          return ks.sendKey('');
      }
    case 5:
      switch (currPage) {
        case PAGE_MAIN:
          return ks.sendKey('');
      }
    case 4:
      return;
    case 9:
      return;
    case 8:
      return;
    case 7:
      return;
    case 6:
      return;
    case 5:
      return;
    case 14:
      return;
    case 13:
      return;
    case 12:
      return;
    case 11:
      return;
    case 10:
      switch (currPage) {
        case PAGE_MAIN:
          return createPage(PAGE_SETTINGS);
      }
  }
};

const streamDeck = new StreamDeck();

streamDeck.setBrightness(BRIGHTNESS);

streamDeck.on('down', keyIndex => {
  console.log('key %d down', keyIndex);
});

streamDeck.on('up', keyIndex => {
  console.log('key %d up', keyIndex);
  handleKeyPressed(keyIndex);
});

// Fired whenever an error is detected by the `node-hid` library.
streamDeck.on('error', error => {
  console.error(error);
});

createPage(PAGE_MAIN);