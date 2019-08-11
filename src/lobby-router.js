const express = require('express');

const isOgs = require('./api/ogs/verify-ogs-parameters');

const router = express.Router();

router.route('/')
  .get((request, response) => {
    if (request.query.account) {
      response.json(activeUsers.ogs[request.query.account].availableChallenges);
    } else {
      response.status(403).json({message: 'You did not provide a user account'});
    }
  })
  .post((request, response) => {
    let data = request.body;

    if (data.account) {
      response.json(activeUsers.ogs[data.account].availableChallenges);
    } else {
      response.status(403).json({message: 'You did not provide a user account'});
    }
  })

router.post('/accept', (request, response) => {
  let data = request.body;

  if (isOgs(data)) {
    let user = activeUsers.ogs[data.account];
    user.acceptChallenge(data.game, data.challenge)
      .then(body => response.json({ message: 'success!' }))

      .catch(ogsResponse => response.status(400).json(ogsResponse.data));
  } else {
    // We only support OGS in the initial version
    response.status(403).json({ message: "You are trying to access an unknown server" });
  }
});

router.post('/create', (request, response) => {
  let data = request.body;

  if (isOgs(data)) {
    let user = activeUsers.ogs[data.account]; //TODO: In the second attempt to open a challenge by the same user, user variable is undefined ???
    user.openChallenge(data.game)
      .then(body => response.json(body))
      .catch(ogsResponse => response.status(400).json(ogsResponse.data));
  } else {
    response.status(403).json({ message: "You are trying to access an unknown server" });
  }
});

router.post('/cancel', (request, response) => {
  let data = request.body;

  if (isOgs(data)) {
    let user = activeUsers.ogs[data.account];

    user.cancelChallenge(data.game_id, data.challenge_id)
      .then(ogsResponse => response.json(ogsResponse));
  } else {
    response.status(403).json({ message: "You are trying to access an unknown server" });
  }
});

router.get('/openGames/:accID',(request,response)=>{
  if(activeUsers.ogs[request.params.accID]) {
    let challenges = activeUsers.ogs[request.params.accID].availableChallenges;
    response.status(200).json(activeUsers.ogs[request.params.accID].availableChallenges);
  }else{
    response.status(404).json({message:"undefined parameter"});
  }
});

router.get('/inProgress/:accID',(request,response)=>{
  if(activeUsers.ogs[request.params.accID]) {
    let challenges = activeUsers.ogs[request.params.accID].activeGames;
    response.status(200).json(activeUsers.ogs[request.params.accID].activeGames);
  }else{
    response.status(404).json({message:"undefined parameter"});
  }
});


router.get('/joinedChats/:accID',(request,response)=>{
  if(activeUsers.ogs[request.params.accID]) {
    response.status(200).json(activeUsers.ogs[request.params.accID].joinedChats);
  }else{
    response.status(404).json({message:"undefined parameter"});
  }
});

module.exports = router;
