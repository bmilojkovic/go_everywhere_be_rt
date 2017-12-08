const SocketIOClient = require('socket.io-client');
const generateUUID = require('uuid/v1');
const fetch = require('node-fetch');

const ogsUrl = "https://online-go.com";
const ogsClientConfig = {
  reconnection: true,
  reconnectionDelay: 750,
  reconnectionDelayMax: 10000,
  transports: ["websocket"],
  upgrade: false,
};

const handlePing = (socket) => {
  // TODO: handle ping/pong with user latency/drift
}

const transformMove = move => {
  let row = String.fromCharCode(move[0] + 96);
  let column = String.fromCharCode(move[1] + 96);
  return column+row;
};

class User {

  constructor(userData) {
    this.userData = userData;

    //default joined chats
    this.joinedChats = ['english', 'offtopic'];

    this.availableChallenges = [];
    this.activeGames = [];

    this.challengeIntervalID = {};
  }

  init(geSio) {
    this.geSio = geSio;
    console.log(`Creating OGS socket for ${this.userData.userId}`);
    this.ogsSio = SocketIOClient(ogsUrl, ogsClientConfig);
    fetch('https://online-go.com/api/v1/ui/overview', {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.userData.restToken}`
      },
      method: 'GET'
    })
      .then(response => response.json())
      .then(overview => {
        this.activeGames = overview.active_games;
        this.activeGames.forEach(
          (game) => this.registerGameChannels(game.json.game_id)
        );
        this.handleDisconnect();
        // this.setUpChats();
        this.registerOGSListeners();
        // this.registerGEListeners();
        this.ogsHandshake();
      });
  }

  fooBar(payload) {
    this.geSio.emit('testing', payload);
  }

  handleIncomingChatMsg(payload) {

    //converting into our specification
    let geAccount = {
      server: "OGS",
      id: payload["id"],
      username: payload["username"],
      rank: payload["ranking"],
      additionalInfo: {
        country: payload["country"],
        rating: payload["rating"]
      }
    };

    let geMessage = {
      from: geAccount,
      to: null,
      message: payload.message
    };

    this.geSio.emit('chat-message', geMessage);

  }

  setUpChats() {
    //incoming chat requests handling
    this.ogsSio.on('chat-message', (payload) => this.handlePublicMessage('message', payload)); //sent and recived messages go through this channel
    this.ogsSio.on('chat-part', (payload) => this.handlePublicMessage('leave', payload));  // when another user joins any of the chat channels we will get notified
    this.ogsSio.on('chat-join', (payload) => this.handlePublicMessage('join', payload)); // when another user joins any chat channel we will get notified

    // Send private messages to the appropriate channel
    this.ogsSio.on('private-message', (payload) => {
      this.ogsSio.emit('user/monitor', [payload.from.id]);
      this.geSio.emit('private-chat', payload);
    });

    this.geSio.on('public-chat', (payload) => this.ogsSio.emit('chat/send', { ...payload, uuid: generateUUID() }));

    // TODO :Maybe drop generateGUID and just use "asd.1" :\
    // NOTE: "uid" is not a typo
    this.geSio.on('private-chat', (payload) => {
      payload = {
        ...payload,
        uid: "asd." + Math.floor(Math.random() * 100)
      }
      this.ogsSio.emit('chat/pm', payload,
        (response) => { console.log(response); this.geSio.emit('private-chat', response) });
    });

    this.joinChats();
  }

  handleDisconnect() {
    this.geSio.on('disconnect', () => this.ogsSio.close());
    // TODO: additional cleanup?
  }

  /**
   * Helper function for sending all public chat data to single channel
   * @param {*} type
   * @param {*} payload
   */
  handlePublicMessage(type, payload) {
    this.geSio.emit('public-chat', { payload, type }); // TODO: unpack payload?
  }

  handleActiveGame(activeGame) {
    if (activeGame.phase === "finished") {
      let gameIndex = this.activeGames.findIndex(game => game.json.game_id === activeGame.id);
      if (gameIndex > -1) {
        this.activeGames.splice(gameIndex, 1);
      }
      this.unregisterGameChannels(activeGame.id);
    }
  }

  registerOGSListeners() {

    // this.ogsSio.on('active_game', (payload) => this.handleActiveGame.bind(this));
    this.ogsSio.on('seekgraph/global', (payload) => this.handleSeekgraphData.bind(this));
  }

  /**
   * OGS uses the "seekgraph/global" channel to:
   * 1) Dump all the available challenges on connection
   * 2) Notify the user of newly available challenges
   * 3) Notify the user that a challenge is closed (e.g. someone else accepted it)
   */
  handleSeekgraphData(payload) {

    // If the array has one element, and that element has a "gameStarted" property,
    // that means it's the third case
    if (payload[0].gameStarted || payload[0].delete) {
      let gameIndex = this.availableChallenges.findIndex(game => game.game_id === payload[0].game_id);
      // TODO notify socket that a challenge was closed
      this.availableChallenges.splice(gameIndex, 1);
    } else {
      this.availableChallenges = this.availableChallenges.concat(payload);
      if (payload.length === 1) {
        this.geSio.emit('challenge', payload[0]);
      }
    }
  }

  handleGameAction(action) {
    switch (action.type) {
      case 'move':
        this.ogsSio.emit('game/move', {
          game_id: action.game_id,
          player_id: this.userData.userId,
          move: transformMove(action.move)
        });
        return { message: "Move successfully sent" };
      case 'pass':
        this.ogsSio.emit('game/move', {
          game_id: action.game_id,
          player_id: this.userData.userId,
          move: ".." // OGS understands ".." as a pass
        });
        return {success: true, message: "Move successfully sent" };
      case 'resign':
        this.ogsSio.emit('game/resign', {
          game_id: action.game_id,
          player_id: this.userData.userId
        });
        return {success: true, message: "Move successfully sent" };
      default:
        return {success: false, message: "Unknown action"};
    }
  }

  // disconnectFromGame(payload) {
  //   if (!payload.hasOwnProperty('game_id')) {
  //     return false;
  //   }

  //   let game_id = payload.game_id;
  //   ogsSio.emit('game/disconnect', payload);

  //   // Remove game channels
  //   this.unregisterGameChannels(game_id);
  // }

  openChallenge(payload) {
    return fetch('https://online-go.com/api/v1/challenges/', {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.userData.restToken}`
      },
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(response => response.json())
      .then(data => {

        // Don't use destructuring here, we use this format for polling keepalive
        let challenge_data = {
          challenge_id: data.challenge,
          game_id: data.game
        }

        this.registerGameChannels(challenge_data.game_id);
        this.ogsSio.emit('game/connect', {
          game_id: challenge_data.game_id,
          player_id: this.userData.userId,
          chat: true
        })

        this.challengeIntervalID[challenge_data.challenge_id] = setInterval(
          () => this.ogsSio.emit('challenge/keepalive', challenge_data),
          1000
        );

        // TODO ovde zavrsi logiku za otvaranje igre
        this.ogsSio.on('notification', (payload) => {
          if (payload.type === 'gameStarted' &&
            payload.game_id === challenge_data.game_id) {
            clearInterval(this.challengeIntervalID[challenge_data.challenge_id]);
            this.geSio.emit('challenge-accept', {
              ...challenge_data,
              white: payload.white,
              black: payload.black
            });
          }
        });
        return data;
      })

      .catch(error => console.log(error));
  }

  acceptChallenge(game_id, challenge_id) {

    this.registerGameChannels(game_id);

    this.ogsSio.emit('game/connect', {
      game_id,
      challenge_id,
      player_id: this.userData.userId
    });

    // Propagate promise back to REST controller
    // `http://online-go.com/api/v1/challenges/${challenge_id}/accept`
    return fetch(`https://online-go.com/api/v1/challenges/${challenge_id}/accept`, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${this.userData.restToken}`
      },
      method: 'POST'
    });
  }

  cancelChallenge(game_id, challenge_id) {

    this.ogsSio.emit('game/disconnect', { game_id });

    // Cancel challenge on REST
    this.unregisterGameChannels(game_id);

    /**
     * If we are currently polling "challenge/keepalive", disable it
     */
    if (this.challengeIntervalID[challenge_id]) {
      clearInterval(this.challengeIntervalID[challenge_id]);
    }

    return fetch(`https://online-go.com/api/v1/challenges/${challenge_id}`, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.userData.restToken}`
      },
      method: 'DELETE'
    })
      .then(response => response.json());
  }

  handleGameClock(clock) {
    let game = this.activeGames.find(game => game.json.game_id === clock.game_id);
    console.log(this.activeGames);
    console.log(clock.game_id);
    game.json.clock = clock;
  }

  handleGameMove(moveData) {
    let gameToUpdate = this.activeGames.find(game => game.json.game_id === moveData.game_id);
    gameToUpdate.json.moves.push(moveData.move);
    this.geSio.emit('game/move', {
      server: "ogs",
      room: "ogs",
      lobby: "ogs",
      game: moveData.game_id,
      move: moveData.move
    });
  }

  handleGameData(newGame) {
    let gameIndex = this.activeGames.findIndex(game => game.json.game_id === newGame.game_id);
    if (gameIndex === -1) {
      this.activeGames[gameIndex].json = newGame
    }

    this.geSio.emit('game/game', {
      server: "ogs",
      room: "ogs",
      lobby: "ogs",
      game: newGame
    });
  }

  registerGameChannels(game_id) {
    console.log('Registering channels for: ' + game_id);
    this.ogsSio.emit('chat/join', { channel: `game-${game_id}` })
    this.ogsSio.on(`game/${game_id}/chat`, (payload) => this.geSio.emit('game-chat', { payload, game_id }));

    this.ogsSio.on(`game/${game_id}/gamedata`, this.handleGameData.bind(this));
    this.ogsSio.on(`game/${game_id}/clock`, this.handleGameClock.bind(this));
    this.ogsSio.on(`game/${game_id}/move`, this.handleGameMove.bind(this));
    // this.ogsSio.on(`game/${game_id}/conditional_moves`, (payload) => this.geSio.emit('game-conditional-moves', { payload, game_id }));
    // this.ogsSio.on(`game/${game_id}/reset-chats`, (payload) => this.geSio.emit('game-reset-chats', { payload, game_id }));
    // this.ogsSio.on(`game/${game_id}/undo_requested`, (payload) => this.geSio.emit('game-undo-requested', { payload, game_id }));
    // this.ogsSio.on(`game/${game_id}/undo_accepted`, (payload) => this.geSio.emit('game-undo-accepted', { payload, game_id }));
  }

  unregisterGameChannels(game_id) {
    this.ogsSio.off(`game/${game_id}/chat`);

    this.ogsSio.off(`game/${game_id}/gamedata`);
    this.ogsSio.off(`game/${game_id}/clock`);
    this.ogsSio.off(`game/${game_id}/move`);
    // this.ogsSio.off(`game/${game_id}/conditional_moves`);
    // this.ogsSio.off(`game/${game_id}/reset-chats`);
    // this.ogsSio.off(`game/${game_id}/undo_requested`);
    // this.ogsSio.off(`game/${game_id}/undo_accepted`);
  }

  registerForChat(channel) {
    //here we register for individual chats
    channel = 'global-' + channel; // FIXME
    this.ogsSio.emit('chat/join', { channel });
  }

  joinChats() {
    // default channels that are joined on login
    this.joinedChats.forEach(this.registerForChat.bind(this));
  }

  /**
   * Initialize the client socket towards OGS.
   */
  ogsHandshake() {
    this.ogsSio.emit('hostinfo');

    this.ogsSio.emit('ui-pushes/subscribe', { channel: "announcements" });
    this.ogsSio.emit('ui-pushes/subscribe', { channel: "undefined" });
    this.ogsSio.emit('notification/connect', {
      "player_id": this.userData.userId,
      "auth": this.userData.notificationAuth
    });
    this.ogsSio.emit('adblock', 'not_checked');
    this.ogsSio.emit('automatch/list');
    this.ogsSio.emit("authenticate", {
      "auth": this.userData.chatAuth,
      "player_id": this.userData.userId,
      "username": this.userData.username
    });
    this.ogsSio.emit("chat/connect", {
      "auth": this.userData.chatAuth,
      "player_id": this.userData.userId,
      "ranking": 0,
      "username": this.userData.username,
      "ui_class": "timeout provisional"
    });
    this.ogsSio.emit("incident/connect", {
      "player_id": this.userData.userId,
      "auth": this.userData.incidentAuth
    });
    // this.ogsSio.emit('chat/join', {
    // 'channel': "global-english"
    // })

    this.ogsSio.emit("ad", "supporter");
    this.ogsSio.emit("ad", "supporter");
    this.ogsSio.emit("seek_graph/connect", { 'channel': 'global' });
    return;
  }

  enterMatchmaking() {
    // We might need to use uuid v5?
    const uuid = generateUUID();
    this.ogsSio.emit('automatch/find_match', {
      uuid,
      size_speed_options: [
        {
          size: "19x19",
          speed: "live"
        }
      ],
      lower_rank_diff: 3,
      upper_rank_diff: 3,
      rules: {
        condition: "no-preference",
        value: "japanese"
      },
      time_control: {
        condition: "no-preference",
        value: {
          system: "byoyomi"
        }
      },
      handicap: {
        condition: "no-preference",
        value: "enabled"
      }
    });
  }

}

module.exports = User;
