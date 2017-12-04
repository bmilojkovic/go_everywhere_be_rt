import axios from 'axios';
import qs from 'qs';

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
  var h = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Access-Control-Allow-Headers': "Access-Control-Allow-Headers, Authorization"

  }
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
  })
    .then((response) => {
      var accessToken = response.data['access_token']
      var refreshToken = response.data['refresh_token']
      return request("GET", "http://online-go.com/api/v1/me/", null, accessToken)
    })
    .then((response1) => {
      var userId = response1.data['id']
      return request('GET', "http://online-go.com/api/v1/ui/config", null, accessToken)
        .then((configResponse) => {
          return {
            userId: userId,
            chatAuth: configResponse.data['chat_auth'],
            incidentAuth: configResponse.data['incident_auth'],
            notificationAuth: configResponse.data['notification_auth'],
            username: configResponse.data.user.username
          };
        });
    })
    .catch((error) => {
      console.log(error);
    });
}
