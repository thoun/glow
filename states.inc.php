<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Glow implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 * 
 * states.inc.php
 *
 * Glow game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!

require_once("modules/php/constants.inc.php");

$basicGameStates = [

    // The initial state. Please do not modify.
    ST_BGA_GAME_SETUP => [
        "name" => "gameSetup",
        "description" => clienttranslate("Game setup"),
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => [ "" => ST_PLAYER_CHOOSE_ADVENTURER ]
    ],

    ST_NEXT_PLAYER_CHOOSE_ADVENTURER => [
        "name" => "nextPlayerChooseAdventurer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayerChooseAdventurer",
        "transitions" => [
            "nextPlayer" => ST_PLAYER_CHOOSE_ADVENTURER, 
            "end" => ST_START_ROUND,
        ],
    ],

    ST_NEXT_PLAYER_RECRUIT => [
        "name" => "nextPlayerRecruit",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayerRecruit",
        "transitions" => [
            "nextPlayer" => ST_START_ROUND, 
            "end" => ST_MULTIPLAYER_ROLL_DICE,
        ],
    ],
   
    // Final state.
    // Please do not modify.
    ST_END_GAME => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd",
    ],
];


$playerActionsGameStates = [

    ST_PLAYER_CHOOSE_ADVENTURER => [
        "name" => "chooseAdventurer",
        "description" => clienttranslate('${actplayer} must choose an adventurer'),
        "descriptionmyturn" => clienttranslate('${you} must choose an adventurer'),
        "type" => "activeplayer",
        "args" => "argChooseAdventurer",
        "possibleactions" => [ 
            "chooseAdventurer",
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER_CHOOSE_ADVENTURER,
            "zombiePass" => ST_NEXT_PLAYER_CHOOSE_ADVENTURER,
        ]
    ],

    ST_PLAYER_RECRUIT_COMPANION => [
        "name" => "recruitCompanion",
        "description" => clienttranslate('${actplayer} must recruit a companion'),
        "descriptionmyturn" => clienttranslate('${you} must recruit a companion'),
        "type" => "activeplayer",
        //"args" => "argRecuitCompanion",
        "possibleactions" => [ 
            "recruitCompanion",
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER_RECRUIT,
            "removeCompanion" => ST_PLAYER_REMOVE_COMPANION,
            "zombiePass" => ST_NEXT_PLAYER_RECRUIT,
        ]
    ],

    ST_PLAYER_REMOVE_COMPANION => [
        "name" => "removeCompanion",
        "description" => clienttranslate('${actplayer} must remove a companion'),
        "descriptionmyturn" => clienttranslate('${you} must remove a companion'),
        "type" => "activeplayer",
        //"args" => "argRemoveCompanion",
        "possibleactions" => [ 
            "removeCompanion",
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER_RECRUIT,
            "zombiePass" => ST_NEXT_PLAYER_RECRUIT,
        ]
    ],

    ST_MULTIPLAYER_ROLL_DICE => [
        "name" => "rollDice",
        "description" => clienttranslate('Players can reroll their dice'),
        "descriptionmyturn" => clienttranslate('${you} can reroll their dice'),
        "type" => "multipleactiveplayer",
        //"action" => "stLeaveTokyo",
        //"args" => "argLeaveTokyo",
        "possibleactions" => [ 
            "reroll", 
            "keep" 
        ],
        "transitions" => [
            "keep" => ST_MULTIPLAYER_RESOLVE_CARDS,
            "zombiePass" => ST_MULTIPLAYER_RESOLVE_CARDS,
        ],
    ],

    ST_MULTIPLAYER_RESOLVE_CARDS => [
        "name" => "resolveCards",
        "description" => clienttranslate('Players must resolve their cards'),
        "descriptionmyturn" => clienttranslate('${you} must resolve their cards'),
        "type" => "multipleactiveplayer",
        //"action" => "stLeaveTokyo",
        //"args" => "argLeaveTokyo",
        "possibleactions" => [ 
            "resolve", 
        ],
        "transitions" => [
            "resolve" => ST_MULTIPLAYER_MOVE,
            "zombiePass" => ST_MULTIPLAYER_MOVE,
        ],
    ],

    ST_MULTIPLAYER_MOVE => [
        "name" => "move",
        "description" => clienttranslate('Players must move their company'),
        "descriptionmyturn" => clienttranslate('${you} must move their company'),
        "descriptionboat" => clienttranslate('Players must move their boats'),
        "descriptionmyturnboat" => clienttranslate('${you} must move their boats'),
        "type" => "multipleactiveplayer",
        //"action" => "stLeaveTokyo",
        //"args" => "argLeaveTokyo",
        "possibleactions" => [ 
            "move", 
        ],
        "transitions" => [
            "resolve" => ST_END_ROUND,
            "zombiePass" => ST_END_ROUND,
        ],
    ],

];


$gameGameStates = [
    ST_START_ROUND => [
        "name" => "startRound",
        "description" => "",
        "type" => "game",
        "action" => "stStartRound",
        "transitions" => [ 
            "morning" => ST_PLAYER_RECRUIT_COMPANION,
        ],
    ],

    ST_END_ROUND => [
        "name" => "endRound",
        "description" => "",
        "type" => "game",
        "action" => "stEndRound",
        "transitions" => [ 
            "newRound" => ST_START_ROUND,
            "endGame" => ST_END_GAME
        ],
    ],
];
 
$machinestates = $basicGameStates + $playerActionsGameStates + $gameGameStates;
