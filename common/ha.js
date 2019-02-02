let request = require('superagent'),
  config = require('../config.json'),
  source = [
    'source-tv-virgintivo',
    'source-tv-androidtv',
    'source-tv-lgtv',
    'source-speaker-livingroom',
    'source-speaker-kitchen'
  ],
  sourceId = 0;

const call = (domain, service, entity_id) => {
  console.log(domain, service, entity_id);
  request
    .post(`${config.hass.url}/api/services/${domain}/${service}`)
    .set('Authorization', `Bearer ${config.hass.token}`)
    .send({ entity_id })
    .then(res => console.log(res.body))
    .catch(err => console.error(err));
};

const nextSource = () => sourceId = sourceId === source.length - 1 ? 0 : sourceId + 1;

const getSourceName = () => {
  switch (sourceId) {
    case 0: return 'media_player.virgin_v6';
    case 1: return 'media_player.xiaomi_mi_box_s';
    case 2: return 'media_player.living_room_tv_2';
    case 3: return 'media_player.living_room_speaker';
    case 4: return 'media_player.kitchen_speaker';
  }
};

module.exports = {
  call,
  source,
  sourceId,
  nextSource,
  getSourceName
};