const SocketIOClient = require('socket.io-client');

const ogsUrl = "https://online-go.com"
const ogsClientConfig = {
  reconnection: true,
  reconnectionDelay: 750,
  reconnectionDelayMax: 10000,
  transports: ["websocket"],
  upgrade: false,
};

const handlePing = (socket) => {
  socket.close();
}

// TODO: handle ping/pong with user latency/drift
class User {

  constructor(geSio, userData) {
    console.log('some idiot actually connected lmao');
    this.geSio = geSio;
    this.userData = userData;
    this.ogsSio = SocketIOClient(ogsUrl, ogsClientConfig);
	
	//default joined chats
	this.joinedChats = ['german','spanish','lithuanian','norweigan','english','japanese','thai','vietnamese'];
	
    this.handleDisconnect();
    this.registerListeners();
	this.joinChats();
    this.mainLogic();
  }

  fooBar(payload) {
    this.geSio.emit('testing', payload);
  }

  handleDisconnect() {
    this.geSio.on('disconnect', () => this.ogsSio.close());
    // TODO: additional cleanup?
  }

  registerListeners() {
    this.ogsSio.on('active_game', this.fooBar.bind(this));
    this.ogsSio.on('notification', this.fooBar.bind(this));
    this.ogsSio.on('net/pong', this.fooBar.bind(this));
    this.ogsSio.on('game', this.fooBar.bind(this));
    this.ogsSio.on('seekgraph/global', this.fooBar.bind(this));
    this.ogsSio.on('private-message', this.fooBar.bind(this));
	//incoming chat requests handling
	this.ogsSio.on('chat-message', this.fooBar.bind(this));
	this.ogsSio.on('chat-part', this.fooBar.bind(this));
	this.ogsSio.on('chat-join' , this.fooBar.bind(this));
  }

  registerForChat(channel){
	//here we register for individual chats
	channel='global-'+channel;
	this.ogsSio.emit('chat/join',{channel});
  }
  
  joinChats(){
	  //default channels that are joind on login
	  this.joinedChats.forEach(this.registerForChat.bind(this));
  }
  

  
  mainLogic() {
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

}

module.exports = User;
