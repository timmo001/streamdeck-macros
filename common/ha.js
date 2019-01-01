const request = require('superagent'),
  config = require('../config.json');

const call = (domain, service, entity_id) => {
  request
    .post(`${config.hass.url}/api/services/${domain}/${service}`)
    .set('Authorization', `Bearer ${config.hass.token}`)
    .send({ entity_id })
    .then(res => console.log(res.body))
    .catch(err => console.error(err));
};

module.exports = {
  call
};