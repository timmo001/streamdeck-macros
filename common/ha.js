let WebSocket = require('ws'),
  config = require('../config.json').hass,
  ws = new WebSocket(config.url),
  states = [],
  ready = false,
  source = [
    'source-tv-virgintivo',
    'source-tv-androidtv',
    'source-tv-lgtv',
    'source-speaker-livingroom',
    'source-speaker-kitchen'
  ],
  sourceId = -1;

ws.on('open', open = () => {
  console.log('WS: Opened');
});

ws.on('message', incoming = data => {
  // console.log('WS: Message received:', data);
  const message = JSON.parse(data);
  if (message.type)
    switch (message.type) {
      default:
        console.log('WS: Unhandled message type received:', data);
        break;
      case 'auth_required':
        ws.send(JSON.stringify({
          type: 'auth',
          access_token: config.token
        }), err => err ? console.error('WS:', err) : console.log('WS: Sent token'));
        break;
      case 'auth_ok':
        ready = true;
        ws.send(JSON.stringify({
          id: 19,
          type: 'get_states',
        }), err => err ? console.error('WS:', err) : console.log('WS: Sent get states'));
        break;
      case 'result':
        // console.log('WS: result:', message);
        if (message.id === 19 && message.success && message.result) {
          states = message.result;
          console.log('WS: States set');
          ws.send(JSON.stringify({
            id: 18,
            type: 'subscribe_events',
            event_type: 'state_changed'
          }), err => err ? console.error('WS:', err) : console.log('WS: Sent subscribe'));
        }
        break;
      case 'event':
        console.log('WS: event');
        if (message.event.event_type)
          switch (message.event.event_type) {
            default:
              console.log('WS: Unhandled event type message received:', data);
            case 'state_changed':
              console.log('WS: state_changed');
              break;
          }
        else console.log('WS: Unhandled event message received:', data);
        break;
    }
  else console.log('WS: Unhandled message received:', data);
});

const call = (domain, service, data) => {
  console.log(domain, service, data);
  if (ready)
    ws.send(JSON.stringify({
      id: 24,
      type: 'call_service',
      domain,
      service,
      service_data: data
    }), err => err ? console.error('WS:', err) : console.log('WS: Sent call service'));
};

const nextSource = () => {
  sourceId = sourceId === source.length - 1 ? 0 : sourceId + 1;
  return source[sourceId];
};

const getSourceName = () => {
  switch (sourceId) {
    case 0: return 'media_player.virgin_v6';
    case 1: return 'media_player.xiaomi_mi_box_s';
    case 2: return 'media_player.lg_tv_remote';
    case 3: return 'media_player.living_room_speaker';
    case 4: return 'media_player.kitchen_speaker';
  }
};

const getData = (entity_id, cb) => {
  const item = {
    data: states.find(s => s.entity_id === entity_id),
    cb
  };
  states.push(item);
  cb(item.data);
};

module.exports = {
  call,
  nextSource,
  getSourceName,
  getData
};