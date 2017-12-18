const express = require('express');
const router = express.Router();

const lobbyRouter = require('./lobby-router');
const gameRouter = require('./game-router');
const OGSUser = require('./api/ogs-user');
global.activeUsers = {};
global.activeUsers.ogs = {};

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
  for (var i = 0; i < requiredFields.length; i++) {
    if (!payload.hasOwnProperty(requiredFields[i])) {
      response.status(400).json({ error: `missing property: "${property}"` });
      return;
    }
  }

  const newUser = new OGSUser(payload);
  activeUsers.ogs[payload.userId] = newUser;

  newUser.fetchGames()
    .then(() => response.status(200).json({ status: "success" }));

});

router.get('/token/:userID',(request,response)=>{
  response.status(200).json({restToken:activeUsers.ogs[request.params.userID].userData.restToken}).send();
});

router.use('/challenge', lobbyRouter);
router.use('/game', gameRouter);

function applyRoutes(app) {
  app.use('/api', router);
}

module.exports = applyRoutes;
