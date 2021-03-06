let path = require('path'),
  StreamDeck = require('elgato-stream-deck'),
  cp = require('child_process'),
  ha = require('./common/ha'),
  image = require('./common/image'),
  moment = require('moment'),
  PAGE_MAIN = 'main',
  PAGE_HA = 'home_assistant',
  PAGE_HA_HEATING = 'home_assistant_heating',
  PAGE_SETTINGS = 'settings',
  BRIGHTNESS = 50,
  lastPage = PAGE_MAIN,
  currPage = PAGE_HA,
  timeouts = [],
  clockInterval;

const round = (value, precision) => {
  let multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

const getResource = filePath => path.resolve(__dirname, `resources/${filePath}`);

const setTempImageAndDelete = (key, filePath) => {
  streamDeck.fillImageFromFile(key, filePath);
  setTimeout(() => cp.exec(`rm ${filePath}`), 2000);
};

const updateBrightness = () => {
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
  let oldTime = moment();
  clockInterval = setInterval(() => {
    let blank = getResource('images/blank.png'),
      time = moment();

    if (time.format('mm') > oldTime.format('mm')) {
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
    }
  }, 1000);
};

const createPage = page => {
  let blank = getResource('images/blank.png'),
    back = getResource('images/back.png');
  clearInterval(clockInterval);
  for (let i = 0; i <= 10; i++) { streamDeck.clearKey(i); }
  switch (page) {
    case PAGE_MAIN:
      lastPage = PAGE_MAIN;
      // Row 1
      streamDeck.fillImageFromFile(4, getResource('images/ha.png'));
      // Row 2
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

const handleKeyPressed = key => {
  // Clear any timeouts
  timeouts.map(id => clearTimeout(id));
  switch (key) {
    case 4:
      switch (currPage) {
        default:
          createPage(lastPage);
          break;
        case PAGE_MAIN:
          createPage(PAGE_HA);
          break;
      }
      break;
    case 3:
      switch (currPage) {
        default: break;
        // case PAGE_MAIN:
        //   cp.exec('discord');
        case PAGE_HA:
          ha.call('scene', 'turn_on', { entity_id: 'scene.reset_lights' });
          break;
        case PAGE_SETTINGS:
          BRIGHTNESS -= 5;
          updateBrightness();
          break;
      }
      break;
    case 2:
      switch (currPage) {
        default: break;
        // case PAGE_MAIN:
        //   return cp.exec('spotify');
        case PAGE_HA:
          ha.call('scene', 'turn_on', { entity_id: 'scene.night_mode' });
          break;
        case PAGE_SETTINGS:
          BRIGHTNESS += 5;
          updateBrightness();
          break;
      }
      break;
    case 1:
      switch (currPage) {
        default: break;
        case PAGE_HA:
          createPage(PAGE_HA_HEATING);
          break;
        case PAGE_HA_HEATING:
          ha.getData('climate.central_heating', data => {
            ha.call('climate', 'set_temperature', {
              entity_id: 'climate.central_heating',
              temperature: round(data.attributes.temperature + 0.1, 1)
            });
            setTimeout(() => createPage(currPage), 1000);
          });
          break;
      }
      break;
    case 0:
      break;
    case 9:
      switch (currPage) {
        default: break;
        case PAGE_HA:
          ha.call('media_player', 'volume_down', { entity_id: ha.getSourceName() });
          break;
      }
      break;
    case 8:
      switch (currPage) {
        default: break;
        case PAGE_HA:
          ha.call('media_player', 'media_previous_track', { entity_id: ha.getSourceName() });
          break;
      }
      break;
    case 7:
      switch (currPage) {
        default: break;
        case PAGE_HA:
          ha.call('media_player', 'media_play_pause', { entity_id: ha.getSourceName() });
          break;
      }
      break;
    case 6:
      switch (currPage) {
        default: break;
        case PAGE_HA:
          ha.call('media_player', 'media_next_track', { entity_id: ha.getSourceName() });
          break;
      }
      break;
    case 5:
      switch (currPage) {
        default: break;
        case PAGE_HA:
          ha.call('media_player', 'volume_up', { entity_id: ha.getSourceName() });
          break;
      }
      break
    case 14:
      switch (currPage) {
        default: break;
        case PAGE_HA_HEATING:
          ha.call('scene', 'turn_on', { entity_id: 'scene.heating_boost' });
          break;
      }
      break;
    case 13:
      break;
    case 12:
      break;
    case 11:
      switch (currPage) {
        case PAGE_HA_HEATING:
          ha.getData('climate.central_heating', data => {
            ha.call('climate', 'set_temperature', {
              entity_id: 'climate.central_heating',
              temperature: round(data.attributes.temperature - 0.1, 1)
            });
            setTimeout(() => createPage(currPage), 1000);
          });
          break;
      }
      break;
    case 10:
      switch (currPage) {
        default: break;
        case PAGE_MAIN:
          createPage(PAGE_SETTINGS);
          break;
        case PAGE_HA:
          streamDeck.fillImageFromFile(10, getResource(`images/ha/${ha.nextSource()}.png`));
          break;
      }
      break;
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

createPage(currPage);
