const express = require('express');
const router = express.Router();

const OGSUser = require('./api/ogs-user');
global.activeUsers = {};
global.activeUsers.ogs = {};


router.get('/', (request, response) => response.send('REST API is working!'));
router.post('/', (request, response) => response.json({message: request.body}));

// Assuming that there is a logedin user
router.get('/:serverID/lobby/all',(request,response)=>{
  var serverID = request.params.serverID;


  if(serverID == 'OGS'){

    var chats = ['global-english']; //add more chats here

    var active_games=[];  //relate to OGS rt api for games
    var open_games=[];  // this ??

    var onlyRoom = {
      id: null,
      chats,
      active_games,
      open_games
    }
    var rooms = [];
    rooms.push(onlyRoom);

    //specification object
    var lobby={
      id: null,
      rooms,
    }

    response.json(lobby).status(200).send();

  }else{
    response.status(404).json({message:"No such server"}).send();
  }

});


router.get('/server/:serverID/acc/:accID/lobby/:lobbyID/rooms-to-join',(request,response)=>{

  var serverID = request.params.serverID;
  var accID = request.params.accID;
  var lobbyID = request.params.lobbyID;

  if(serverID == 'OGS'){


  }else{
    response.status(404).json({message:"No such server"}).send();
  }

});


router.get('/server/:serverID/acc/:accID/lobby/:lobbyID:/joined-rooms',(request,response)=>{

  var serverID = request.params.serverID;
  var accID = request.params.accID;
  var lobbyID = request.params.lobbyID;

  if(serverID == 'OGS'){


  }else{
    response.status(404).json({message:"No such server"}).send();
  }

});

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
});

function applyRoutes(app) {
  app.use('/api', router);
}

module.exports = applyRoutes;

