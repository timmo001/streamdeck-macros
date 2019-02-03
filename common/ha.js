let WebSocket = require('ws'),
  config = require(process.env.CONFIG_PATH || '../config.json').hass,
  ws = new WebSocket(config.url),
  states = [],
  data = [],
  ready = false,
  source = [
    'source-tv-virgintivo',
    'source-tv-androidtv',
    'source-tv-lgtv',
    'source-speaker-livingroom',
    'source-speaker-kitchen'
  ],
  sourceId = -1,
  id;

ws.on('open', () => {
  console.log('WS: Opened');
});

ws.on('message', data => {
  // console.log('WS: Message received:', data);
  const message = JSON.parse(data);
  if (message.type) {
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
        id = 10;
        ws.send(JSON.stringify({
          id,
          type: 'get_states',
        }), err => err ? console.error('WS:', err) : console.log('WS: Sent get states'));
        break;
      case 'result':
        if (!message.success) console.log('WS: result -', message);
        if (message.id && message.id === id && message.success && message.result) {
          states = message.result;
          console.log('WS: States set');
          id += 1;
          ws.send(JSON.stringify({
            id,
            type: 'subscribe_events',
            event_type: 'state_changed'
          }), err => err ? console.error('WS:', err) : console.log('WS: Sent subscribe'));
        }
        break;
      case 'event':
        if (message.event.event_type)
          switch (message.event.event_type) {
            default:
              console.log('WS: Unhandled event type message received:', data);
              break;
            case 'state_changed':
              let stateId = states.findIndex(s =>
                s.entity_id === message.event.data.old_state.entity_id);
              states[stateId] = message.event.data.new_state;
              if (data && data.length > 0 && data.map) data.map(d => {
                if (d.data.entity_id === states[stateId].entity_id)
                  d.cb(d.data);
              });
              break;
          }
        else console.log('WS: Unhandled event message received:', data);
        break;
    }
  } else console.log('WS: Unhandled message received:', data);
});

const call = (domain, service, data) => {
  console.log(domain, service, data);
  if (ready) {
    id += 1;
    ws.send(JSON.stringify({
      id,
      type: 'call_service',
      domain,
      service,
      service_data: data
    }), err => err ? console.error('WS:', err) : console.log('WS: Sent call service'));
  }
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
  data.push(item);
  cb(item.data);
};

module.exports = {
  call,
  nextSource,
  getSourceName,
  getData
};