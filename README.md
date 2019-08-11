# Go Everywhere Real Time API

## REST endpoints:


## Socket.io communication:

`game/move` - Used for making a move for a game in progress. Example:
```javascript
{
    server: "ogs",
    lobby: "ogs",
    room: "ogs",
    account: 123123,
    game: 409409
    move: "1a" // TODO figure me out
}
```

`game/pass` - Used for passing a turn for a game in progress. Example:
```javascript
{
    server: "ogs",
    lobby: "ogs",
    room: "ogs",
    account: 123123,
    game: 409409

}
```

`game/resign` - Used for resigning from a game in progress. Example:
```javascript
{
    server: "ogs",
    lobby: "ogs",
    room: "ogs",
    account: 123123,
    game: 409409

}
```
