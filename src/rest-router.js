const express = require('express');
const router = express.Router();

const OGSUser = require('./api/ogs-user');
global.activeUsers = {};
global.activeUsers.ogs = {};


router.get('/', (request, response) => response.send('REST API is working!'));
router.post('/', (request, response) => response.json({message: request.body}));

router.post('/auth', (request, response) => {
  let payload = request.body;

  const requiredFields = [
    'restToken',
    'username',
    'userId',
    'chatAuth',
    'notificationAuth',
    'incidentAuth'
  ];
  for (property in requiredFields) {
    if (!payload.hasOwnProperty(property)) {
      response.status(400).json({error: `missing property: "${property}"`});
      return;
    }
  }

  var newUser = new OGSUser(payload);
  activeUsers.ogs[payload.userId] = newUser;
  response.status(200).json({userID:payload.userID}).send(); //returning userID so the accID in the next rest calls will be the actual userID assigned
});

function applyRoutes(app) {
  app.use('/api', router);
}

module.exports = applyRoutes;
