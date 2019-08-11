const socketOne = require('socket.io-client')('http://localhost:4700');
const socketTwo = require('socket.io-client')('http://localhost:4700');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var axios = require('axios');
var qs = require('qs');
const fetch = require('node-fetch');


var request = function (method, uri, d = null, token = '') {
  if (!method) {
    console.error('API function call requires method argument')
    return
  }
  if (!uri) {
    console.error('API function call requires uri argument')
    return
  }
  var url = uri
  console.log('sending request to ' + url)
  var h = {}
  if (token) {
    h['Authorization'] = 'Bearer ' + token
  }
  var params = {}
  return axios({
    method,
    url,
    data: qs.stringify(d),
    params,
    headers: h
  })
}

var authenticate = (username, password) => {
  return request("POST", "https://online-go.com/oauth2/token/", {
    "client_id": "eEMzUcZLmQmfjfoNO4bEJZOqC2K85eivXiL1u9kl",
    "client_secret": "yv6PY85TyGbCQJ6a8mL0eQwCZhPDrMgbpCVlbAIFSFGTK0FgEASiaRkKaxYKBToOlYO3TZi7w5Kc6EbTH8kvONsqgc7SuZdfOSoqfBnLCfVEppiSyyYXsCkVKCxfvXXj",
    "grant_type": "password",
    "username": username,
    "password": password
  }).then((response) => {
    var accessToken = response.data['access_token']
    var refreshToken = response.data['refresh_token']
    return request("GET", "http://online-go.com/api/v1/me/", null, accessToken).then((response1) => {
      var userId = response1.data['id']
      request("GET", "http://online-go.com/api/v1/ui/overview", null, accessToken)
        .then(response => {
          console.log('=========================================');
          console.log(username);
          console.log(JSON.stringify(response.data));
          console.log('=========================================');
        });
      return request('GET', "http://online-go.com/api/v1/ui/config", null, accessToken).then((configResponse) => {
        return {
          restToken: accessToken,
          userId,
          chatAuth: configResponse.data['chat_auth'],
          incidentAuth: configResponse.data['incident_auth'],
          notificationAuth: configResponse.data['notification_auth'],
          username: configResponse.data.user.username
        };
      });
    });
  })
    .catch((error) => {
      console.log(error);
    });
}


var openGame = {
  "initialized": false,
  "min_ranking": -1000,
  "max_ranking": 1000,
  "challenger_color": "automatic",
  "game": {
    "handicap": 0,
    "time_control": "fischer",
    "challenger_color": "white",
    "rules": "japanese",
    "ranked": false,
    "width": 9,
    "height": 9,
    "komi_auto": "custom",
    "komi": 5.5,
    "disable_analysis": false,
    "pause_on_weekends": false,
    "initial_state": null,
    "private": false,
    "name": "Test Game don't join !",
    "time_control_parameters": {
      "system": "fischer",
      "speed": "live",
      "initial_time": 3600,
      "time_increment": 1800,
      "max_time": 3600,
      "pause_on_weekends": false,
      "time_control": "fischer"
    }
  }
};


// socketOne.on('seekgraph-global',(payload)=> console.log(payload));
socketOne.on('challenge-accept', payload => console.log(payload));
socketTwo.on('challenge-accept', payload => console.log(payload));

authenticate('mytestusername', 'dusan4323').then((firstUserData) => {

  console.log('User data aquired through OGS REST for User 1: \n' + JSON.stringify(firstUserData));
  global.firstUserAccount = firstUserData.userId;
  console.log('Request to authenticate User1 1');

  fetch('http://localhost:4700/api/auth', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(firstUserData)
  }).then((response) => {
    if (response.status !== 200) {
      console.log('Greska u autentifikaciji sa expres-om!');
    } else {

      console.log('Emiting to socket channel for User1: \n' + JSON.stringify({
        userId: firstUserData.userId
      }));

      socketOne.emit('auth', {
        userId: firstUserData.userId
      });

      let body = {
        game: openGame,
        account: firstUserData.userId,
        lobby: "ogs",
        server: "ogs",
        room: "ogs"
      }

      console.log('Request to create a challange: \n' + JSON.stringify(body));

      fetch('http://localhost:4700/api/challenge/create', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(body)
      })
        .then(response => response.json())
        .then(gameResponse => {
          authenticate('peradetlic', 'qweqwe').then((secondUserData) => {

            console.log('User data aquired through OGS REST for User 2' + JSON.stringify(secondUserData));
            global.secondUserAccount = secondUserData.userId;
            console.log('Request to authenticate User 2');
            fetch('http://localhost:4700/api/auth', {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              method: 'POST',
              body: JSON.stringify(secondUserData)
            }).then((response) => {
              if (response.status !== 200) {
                console.log('Greska u autentifikaciji sa expres-om!');
              } else {

                console.log('Emiting to socket channel for User2: \n' + JSON.stringify({
                  userId: secondUserData.userId
                }));

                socketTwo.emit('auth', {
                  userId: secondUserData.userId
                });

                console.log('User 2 accepts the challange: \n')

                global.game_id = gameResponse.game;
                fetch('http://localhost:4700/api/challenge/accept', {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  method: 'POST',
                  body: JSON.stringify({
                    server: "ogs",
                    room: "ogs",
                    lobby: "ogs",
                    account: secondUserData.userId,
                    game: gameResponse.game,
                    challenge: gameResponse.challenge
                  })
                })
                  .then(response => response.json())
                  .then(response => console.log('Accepting challange response:\n' + JSON.stringify(response)))
                  .then(
                  () => {
                    for (let i = 0; i < 10; i++) {
                      setTimeout(
                        () => {
                          let body = {
                            server: "ogs",
                            room: "ogs",
                            lobby: "ogs",
                            account: i % 2 ? global.firstUserAccount : global.secondUserAccount,
                            game_id: gameResponse.game,
                            type: 'move',
                            move: [parseInt(i / 9), i % 9]
                          };
                          console.log('====================================')
                          console.log('Attempting to make move: ')
                          console.log(body)
                          console.log('====================================')
                          fetch('http://localhost:4700/api/game', {
                            headers: {
                              'Content-Type': 'application/json',
                              'Accept': 'application/json'
                            },
                            method: 'POST',
                            body: JSON.stringify(body)
                          })
                        }
                        , i * 1000);
                    }
                    setTimeout(() => {
                      fetch('http://localhost:4700/api/game', {
                        headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json'
                        },
                        method: 'POST',
                        body: JSON.stringify({
                          server: "ogs",
                          room: "ogs",
                          lobby: "ogs",
                          type: 'pass',
                          game_id: gameResponse.game,
                          account: global.secondUserAccount
                        })
                      });
                      setTimeout(
                        () => fetch('http://localhost:4700/api/game', {
                          headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                          },
                          method: 'POST',
                          body: JSON.stringify({
                            server: "ogs",
                            room: "ogs",
                            lobby: "ogs",
                            type: 'pass',
                            game_id: gameResponse.game,
                            account: global.firstUserAccount
                          })
                        })
                        , 2000);

                    }, 14000)
                  }
                  )
              }
            });
          });
        });
    }
  });
});