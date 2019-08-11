const express = require('express');
const isOgs = require('./api/ogs/verify-ogs-parameters');

const router = express.Router();

router.post('/', (request, response) => {
  let data = request.body;

  if (isOgs(data)) {
    let actionResult = activeUsers.ogs[data.account].handleGameAction(data);
    let status = actionResult.success ? 200 : 403;
    response.status(status).json(actionResult);
  } else {
    response.status(403).json({ message: "You are trying to access an unknown server" });
  }
});

router.get('/getGame/:accID/:gameID',(request,resposne)=>{

    for (let game of activeUsers.ogs[request.params.accID].activeGames){
        if(game.game_id === request.params.gameID){
          response.status(200).json(game).send();
        }
    }

    response.status(400).json({error:'Game not found'}).send();

});

module.exports = router;
