const express = require('express');

const isOgs = require('./api/ogs/verify-ogs-parameters');

const router = express.Router();

router.post('room/join-game', (request, response) => {
  let data = request.body;

  if (isOgs(data)) {
    let user = activeUsers[data.account];

    user.acceptChallenge(data.game, data.challenge)
      .then(ogsResponse => ogsResponse.json())
      .then(body => response.json(body))

      .catch(ogsResponse => response.status(400).json(ogsResponse.data));
  } else {
    // We only support OGS in the initial version
    response.status(403).json({ message: "You are trying to access an unknown server" });
  }
});

router.post('lobby/post-game', (request, response) => {
  let data = request.body;

  if (isOgs(data)) {
    let user = activeUsers[data.account];

    user.openChallenge(data)
      .then(ogsResponse => ogsResponse.json())
      .then(body => response.json(body))

      .catch(ogsResponse => response.status(400).json(ogsResponse.data));
  } else {
    response.status(403).json({ message: "You are trying to access an unknown server" });
  }
});

module.exports = router;
