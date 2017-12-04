# Go Everywhere Real Time API

## Available channels for sending data:

`authenticate` - used only for initial authentication

### Chat channels:

`chat` - used for chatting with channels (e.g. _English_ or _Offtopic_)
`private-chat` - used for sending private (one-on-one) messages

### Game channels:

`game-connect` - TODO
`game-disconnect` - TODO

`game-gamedata` - Sent when initializing the game, contains rules and other
information:

```javascript
{
    "handicap": 0,
    "disable_analysis": true,
    "private": true,
    "height": 9,
    "time_control": {
        "system": "fischer",
        "pause_on_weekends": false,
        "time_control": "fischer",
        "initial_time": 3600,
        "max_time": 3600,
        "time_increment": 1800,
        "speed": "live"
    },
    "ranked": false,
    "meta_groups": [],
    "komi": 5.5,
    "game_id": 10815255,
    "width": 9,
    "rules": "chinese",
    "black_player_id": 481097,
    "pause_on_weekends": false,
    "white_player_id": 478486,
    "players": {
        "white": {
            "username": "mytestusername",
            "professional": false,
            "egf": 0,
            "rank": 0,
            "id": 478486
        },
        "black": {
            "username": "minusGo",
            "professional": false,
            "egf": -96.631,
            "rank": 8,
            "id": 481097
        }
    },
    "game_name": "Vuk Bozovic",
    "phase": "play",
    "history": [],
    "initial_player": "black",
    "moves": [
        [
            4,
            3,
            8562
        ],
        [
            2,
            6,
            798024
        ]
    ],
    "allow_self_capture": false,
    "automatic_stone_removal": false,
    "free_handicap_placement": true,
    "aga_handicap_scoring": false,
    "allow_ko": false,
    "allow_superko": false,
    "superko_algorithm": "ssk",
    "score_territory": true,
    "score_territory_in_seki": true,
    "score_stones": true,
    "score_prisoners": false,
    "score_passes": true,
    "white_must_pass_last": false,
    "opponent_plays_first_after_resume": false,
    "strict_seki_mode": false,
    "initial_state": {
        "black": "",
        "white": ""
    },
    "start_time": 1512400168,
    "original_disable_analysis": true,
    "auto_score": true,
    "clock": {
        "game_id": 10815255,
        "current_player": 481097,
        "black_player_id": 481097,
        "white_player_id": 478486,
        "title": "Vuk Bozovic",
        "last_move": 1512400974586,
        "expiration": 1512404574586,
        "black_time": {
            "thinking_time": 3600,
            "skip_bonus": false
        },
        "white_time": {
            "thinking_time": 3600,
            "skip_bonus": false
        }
    }
}
```

`game-clock` - Sends a new tick on every turn:
```javascript
{
    "game_id": 10815255,
    "current_player": 478486,
    "black_player_id": 481097,
    "white_player_id": 478486,
    "title": "Vuk Bozovic",
    "last_move": 1512400997908,
    "expiration": 1512404597908,
    "black_time": {
        "thinking_time": 3600,
        "skip_bonus": false
    },
    "white_time": {
        "thinking_time": 3600,
        "skip_bonus": false
    },
    "now": 1512400997909
}
```
`game-move` - Two-way communication. Used for sending and receiving moves.
Out example:
```javascript
{
    "game_id": 10815434,
    "player_id": 478486,
    "move": "bg" // First letter - column index, second letter - row index
}
```
In example:
```javascript
{
    "game_id": 10815434,
    "move_number": 7,
    "move": [
        4, // Column index (zero-indexed)
        6, // Row index (zero-indexed)
        11599 // Lord knows
    ]
}
```

Example of sent message:
```javascript
{
    "game_id": 10815255,
    "player_id": 478486,
    "move": "gg"
}
```
`game-conditional-moves`:
_fuck knows_

`game-reset-chats`: received when first connecting to a game.
Does not seem to have any tangible effect. Does *NOT* receive objects,
but an integer, which always seems to be zero.


`game-undo-request`: Out only. Used for requesting a move reversal:
```javascript
{
    "game_id":10815434,
    "player_id":478486,
    "move_number":2
}
```
`game-undo-requested`: In only. Used when the opponent requests a move reversal.
Does *NOT* receive an object, but an integer representing the move number.


`game-undo-accept`: Out only. Used for accepting a move reversal requested by the
opponent:
```javascript
{
    "game_id": 10815434,
    "player_id": 478486,
    "move_number": 3
}
```
`game-undo-accepted`: In only. Used when the opponent accepts a move reversal.
Does *NOT* receive an object, but an integer representing the move number.
