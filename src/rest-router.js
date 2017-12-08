const express = require('express');
const router = express.Router();

const lobbyRouter = require('./lobby-router');
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
  for (var i=0; i<requiredFields.length; i++) {
    if (!payload.hasOwnProperty(requiredFields[i])) {
      response.status(400).json({error: `missing property: "${property}"`});
      return;
    }
  }

  const newUser = new OGSUser(payload);
  activeUsers.ogs[payload.userId] = newUser;

  response.status(200).json({status: "success"});
});

router.use('/challenge', lobbyRouter);

function applyRoutes(app) {
  app.use('/api', router);
}

module.exports = applyRoutes;
