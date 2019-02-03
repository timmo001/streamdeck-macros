let path = require('path'),
  StreamDeck = require('elgato-stream-deck'),
  cp = require('child_process'),
  // opn = require('opn'),
  // ks = require('node-key-sender'),
  ha = require('./common/ha'),
  image = require('./common/image'),
  moment = require('moment'),
  PAGE_MAIN = 'main',
  PAGE_HA = 'home_assistant',
  PAGE_HA_HEATING = 'home_assistant_heating',
  PAGE_SETTINGS = 'settings',
  BRIGHTNESS = 50,
  lastPage = PAGE_MAIN,
  currPage = PAGE_MAIN,
  timeouts = [],
  clockInterval;

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

const runClock = () => {
  if (clockInterval) clearTimeout(clockInterval);
  clockInterval = setInterval(() => {
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
};

createPage = page => {
  let blank = getResource('images/blank.png'),
    back = getResource('images/back.png');
  clearInterval(clockInterval);
  for (let i = 0; i <= 10; i++) { streamDeck.clearKey(i); }
  switch (page) {
    case PAGE_MAIN:
      lastPage = PAGE_MAIN;
      // Row 1
      streamDeck.fillImageFromFile(4, getResource('images/ha.png'));
      // streamDeck.fillImageFromFile(3, getResource('images/discord.png'));
      // streamDeck.fillImageFromFile(2, getResource('images/spotify.png'));
      // streamDeck.fillImageFromFile(1, getResource('images/github.png'));
      // streamDeck.fillImageFromFile(0, getResource('images/gitlab.png'));
      // Row 2
      // streamDeck.fillImageFromFile(9, getResource('images/vol-down.png'));
      // streamDeck.fillImageFromFile(8, getResource('images/skip-previous.png'));
      // streamDeck.fillImageFromFile(7, getResource('images/play.png'));
      // streamDeck.fillImageFromFile(6, getResource('images/skip-next.png'));
      // streamDeck.fillImageFromFile(5, getResource('images/vol-up.png'));
      // Row 3
      runClock();
      streamDeck.fillImageFromFile(10, getResource('images/settings.png'));
      break;
    case PAGE_HA:
      lastPage = PAGE_MAIN;
      // Row 1
      streamDeck.fillImageFromFile(4, back);
      streamDeck.fillImageFromFile(3, getResource('images/ha/reset.png'));
      streamDeck.fillImageFromFile(2, getResource('images/ha/night.png'));
      streamDeck.fillImageFromFile(1, getResource('images/ha/heating.png'));
      // streamDeck.fillImageFromFile(0, getResource('images/ha/source-tv.png'));
      // Row 2
      streamDeck.fillImageFromFile(9, getResource('images/ha/vol-down.png'));
      streamDeck.fillImageFromFile(8, getResource('images/ha/skip-previous.png'));
      streamDeck.fillImageFromFile(7, getResource('images/ha/play.png'));
      streamDeck.fillImageFromFile(6, getResource('images/ha/skip-next.png'));
      streamDeck.fillImageFromFile(5, getResource('images/ha/vol-up.png'));
      // Row 3
      runClock();
      streamDeck.fillImageFromFile(10, getResource(`images/ha/${ha.nextSource()}.png`));
      break;
    case PAGE_HA_HEATING:
      lastPage = PAGE_HA;
      // Row 1
      streamDeck.fillImageFromFile(4, back);
      streamDeck.fillImageFromFile(1, getResource('images/ha/heating/up.png'));
      // Row 2
      // console.log(ch);
      ha.getData('climate.central_heating', data => {
        image.addText(blank, data.attributes.current_temperature.toString(), true, filePath =>
          setTempImageAndDelete(8, filePath)
        );
        image.addText(blank, data.attributes.temperature.toString(), true, filePath =>
          setTempImageAndDelete(6, filePath)
        );
      });
      // Row 3
      streamDeck.fillImageFromFile(14, getResource('images/ha/heating/boost.png'));
      setTimeout(() => {
        streamDeck.fillImageFromFile(13, blank);
        streamDeck.fillImageFromFile(12, blank);
      }, 200);
      streamDeck.fillImageFromFile(11, getResource('images/ha/heating/down.png'));
      break;
    case PAGE_SETTINGS:
      lastPage = PAGE_MAIN;
      // Row 1
      streamDeck.fillImageFromFile(4, back);
      streamDeck.fillImageFromFile(3, getResource('images/brightness-down.png'));
      streamDeck.fillImageFromFile(2, getResource('images/brightness-up.png'));
      // Row 3
      setTimeout(() => {
        streamDeck.fillImageFromFile(14, blank);
        streamDeck.fillImageFromFile(13, blank);
        streamDeck.fillImageFromFile(12, blank);
        streamDeck.fillImageFromFile(11, blank);
      }, 200);
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
        // case PAGE_MAIN:
        //   return cp.exec('discord');
        case PAGE_HA:
          return ha.call('scene', 'turn_on', { entity_id: 'scene.reset_lights' });
        case PAGE_SETTINGS:
          BRIGHTNESS -= 5;
          return updateBrightness();
      }
    case 2:
      switch (currPage) {
        // case PAGE_MAIN:
        //   return cp.exec('spotify');
        case PAGE_HA:
          return ha.call('scene', 'turn_on', { entity_id: 'scene.night_mode' });
        case PAGE_SETTINGS:
          BRIGHTNESS += 5;
          return updateBrightness();
      }
    case 1:
      switch (currPage) {
        // case PAGE_MAIN:
        //   return opn('https://github.com');
        case PAGE_HA:
          return createPage(PAGE_HA_HEATING);
        case PAGE_HA_HEATING:
          return ha.getData('climate.central_heating', data =>
            ha.call('climate', 'set_temperature', {
              entity_id: 'climate.central_heating',
              temperature: data.attributes.temperature + 0.1
            })
          );
      }
    case 0:
      switch (currPage) {
        // case PAGE_MAIN:
        //   return opn('https://gitlab.com');
      }
    case 9:
      switch (currPage) {
        // case PAGE_MAIN:
        //   return ks.sendKey('');
        case PAGE_HA:
          return ha.call('media_player', 'volume_down', { entity_id: ha.getSourceName() });
      }
    case 8:
      switch (currPage) {
        // case PAGE_MAIN:
        //   return ks.sendKey('');
        case PAGE_HA:
          return ha.call('media_player', 'media_previous_track', { entity_id: ha.getSourceName() });
      }
    case 7:
      switch (currPage) {
        // case PAGE_MAIN:
        //   return ks.sendKey('');
        case PAGE_HA:
          return ha.call('media_player', 'media_play_pause', { entity_id: ha.getSourceName() });
      }
    case 6:
      switch (currPage) {
        // case PAGE_MAIN:
        //   return ks.sendKey('');
        case PAGE_HA:
          return ha.call('media_player', 'media_next_track', { entity_id: ha.getSourceName() });
      }
    case 5:
      switch (currPage) {
        // case PAGE_MAIN:
        //   return ks.sendKey('');
        case PAGE_HA:
          return ha.call('media_player', 'volume_up', { entity_id: ha.getSourceName() });
      }
    case 14:
      switch (currPage) {
        case PAGE_HA_HEATING:
          return ha.call('scene', 'turn_on', { entity_id: 'scene.heating_boost' });
      }
      return;
    case 13:
      return;
    case 12:
      return;
    case 11:
      switch (currPage) {
        case PAGE_HA_HEATING:
          return ha.getData('climate.central_heating', data =>
            ha.call('climate', 'set_temperature', {
              entity_id: 'climate.central_heating',
              temperature: data.attributes.temperature - 0.1
            })
          );
      }
      return;
    case 10:
      switch (currPage) {
        case PAGE_MAIN:
          return createPage(PAGE_SETTINGS);
        case PAGE_HA:
          return streamDeck.fillImageFromFile(10, getResource(`images/ha/${ha.nextSource()}.png`));
      }
  }
};

const streamDeck = new StreamDeck();

streamDeck.setBrightness(BRIGHTNESS);

streamDeck.on('down', keyIndex => console.log('key %d down', keyIndex));

streamDeck.on('up', keyIndex => {
  console.log('key %d up', keyIndex);
  handleKeyPressed(keyIndex);
});

// Fired whenever an error is detected by the `node-hid` library.
streamDeck.on('error', error => console.error(error));

createPage(PAGE_MAIN);
