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
    let user = activeUsers.ogs[data.account];
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

module.exports = router;
