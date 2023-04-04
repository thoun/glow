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
                      method on both client side (Javacript: this.checkAction) and server side (PHP: $this->checkAction).
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
        "transitions" => [ 
            "" => ST_PREPARE_ADVENTURER_CHOICE,
        ]
    ],

    ST_PREPARE_ADVENTURER_CHOICE => [
        "name" => "prepareAdventurerChoice",
        "description" => "",
        "type" => "game",
        "action" => "stPrepareAdventurerChoice",
        "transitions" => [
            "chooseAdventurer" => ST_PLAYER_CHOOSE_ADVENTURER,
            "recruit" => ST_START_ROUND,
            "chooseTomDice" => ST_PLAYER_CHOOSE_TOM_DICE,
        ],
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

    ST_NEXT_PLAYER_RECRUIT_COMPANION => [
        "name" => "nextPlayerRecruitCompanion",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayerRecruitCompanion",
        "transitions" => [
            "nextPlayer" => ST_PLAYER_RECRUIT_COMPANION, 
            "uriomRecruit" => ST_PLAYER_URIOM_RECRUIT_COMPANION,
            "end" => ST_END_RECRUIT,
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
            "chooseTomDice" => ST_PLAYER_CHOOSE_TOM_DICE,
            "zombiePass" => ST_NEXT_PLAYER_CHOOSE_ADVENTURER,
        ]
    ],

    ST_PLAYER_CHOOSE_TOM_DICE => [
        "name" => "chooseTomDice",
        "description" => '',
        "descriptionmyturn" => clienttranslate('${you} must choose Tom dice'),
        "type" => "activeplayer",
        "args" => "argChooseTomDice",
        "possibleactions" => [ 
            "chooseTomDice",
        ],
        "transitions" => [
            "startRound" => ST_START_ROUND,
            "zombiePass" => ST_START_ROUND,
        ]
    ],

    ST_PLAYER_RECRUIT_COMPANION => [
        "name" => "recruitCompanion",
        "description" => clienttranslate('${actplayer} must recruit a companion'),
        "descriptionmyturn" => clienttranslate('${you} must recruit a companion'),
        "type" => "activeplayer",
        "args" => "argRecuitCompanion",
        "action" => "stRecuitCompanion",
        "updateGameProgression" => true,
        "possibleactions" => [ 
            "recruitCompanion",
        ],
        "transitions" => [
            "moveBlackDie" => ST_PLAYER_MOVE_BLACK_DIE,
            "selectSketalDie" => ST_PLAYER_SELECT_SKETAL_DIE,
            "nextPlayer" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
            "removeCompanion" => ST_PLAYER_REMOVE_COMPANION,
            "zombiePass" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
        ]
    ],

    ST_PLAYER_SELECT_SKETAL_DIE => [
        "name" => "selectSketalDie",
        "description" => clienttranslate('${actplayer} must choose a new die'),
        "descriptionmyturn" => clienttranslate('${you} must choose a new die'),
        "type" => "activeplayer",
        "args" => "argSelectSketalDie",
        "possibleactions" => [ 
            "selectSketalDie",
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
            "removeCompanion" => ST_PLAYER_REMOVE_COMPANION,
            "zombiePass" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
        ]
    ],

    ST_PLAYER_MOVE_BLACK_DIE => [
        "name" => "moveBlackDie",
        "description" => clienttranslate('${actplayer} must move black die'),
        "descriptionmyturn" => clienttranslate('${you} must move black die'),
        "type" => "activeplayer",
        "args" => "argMoveBlackDie",
        "possibleactions" => [ 
            "moveBlackDie",
        ],
        "transitions" => [
            "selectSketalDie" => ST_PLAYER_SELECT_SKETAL_DIE,
            "nextPlayer" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
            "removeCompanion" => ST_PLAYER_REMOVE_COMPANION,
            "zombiePass" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
        ]
    ],

    ST_PLAYER_REMOVE_COMPANION => [
        "name" => "removeCompanion",
        "description" => clienttranslate('${actplayer} must remove a companion'),
        "descriptionmyturn" => clienttranslate('${you} must remove a companion'),
        "type" => "activeplayer",
        "args" => "argRemoveCompanion",
        "possibleactions" => [ 
            "removeCompanion",
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
            "zombiePass" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
        ]
    ],

    ST_PLAYER_URIOM_RECRUIT_COMPANION => [
        "name" => "uriomRecruitCompanion",
        "description" => clienttranslate('${actplayer} can recruit the selected companion (Uriom power)'),
        "descriptionmyturn" => clienttranslate('${you} can recruit the selected companion (Uriom power)'),
        "type" => "activeplayer",
        "args" => "argUriomRecruitCompanion",
        "possibleactions" => [ 
            "recruitCompanionUriom", 
            "passUriomRecruit", 
        ],
        "transitions" => [
            "moveBlackDie" => ST_PLAYER_MOVE_BLACK_DIE,
            "selectSketalDie" => ST_PLAYER_SELECT_SKETAL_DIE,
            "nextPlayer" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
            "removeCompanion" => ST_PLAYER_REMOVE_COMPANION,
            "zombiePass" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
            "pass" => ST_NEXT_PLAYER_RECRUIT_COMPANION,
            "zombiePass" => ST_PLAYER_RECRUIT_COMPANION,
        ],
    ],

    ST_MULTIPLAYER_CHANGE_DICE => [
        "name" => "changeDice",
        "description" => clienttranslate('Players can reroll or change their dice'),
        "descriptionmyturn" => clienttranslate('${you} can reroll or change your dice'),
        "type" => "multipleactiveplayer",
        "initialprivate" => ST_PRIVATE_SELECT_DICE_ACTION,
        "action" => "stChangeDice",
        "possibleactions" => [],
        "transitions" => [
            "next" => ST_MULTIPLAYER_SWAP,
            "zombiePass" => ST_MULTIPLAYER_SWAP,
        ],
    ],

    ST_PRIVATE_SELECT_DICE_ACTION => [
        "name" => "privateSelectDiceAction",
        "descriptionmyturn" => clienttranslate('${you} can reroll or change your dice'),
        "type" => "private",
        "args" => "argRollDiceForPlayer",
        "action" => "stSelectDiceAction",
        "possibleactions" => [ 
            "selectDiceToRoll", 
            "selectDieToChange", 
            "keepDice",
        ],
        "transitions" => [
            "rollDice" => ST_PRIVATE_ROLL_DICE,
            "changeDie" => ST_PRIVATE_CHANGE_DIE,
            "rerollImmediate" => ST_PRIVATE_REROLL_IMMEDIATE,
            "zombiePass" => ST_MULTIPLAYER_SWAP,
        ],
    ],

    ST_PRIVATE_ROLL_DICE => [
        "name" => "privateRollDice",
        "descriptionmyturn" => clienttranslate('Select 1 or 2 dice to reroll'),
        "type" => "private",
        "args" => "argRollDiceForPlayer",
        "possibleactions" => [ 
            "rollDice", 
            "cancel",
        ],
        "transitions" => [
            "rerollImmediate" => ST_PRIVATE_REROLL_IMMEDIATE,
            "selectDice" => ST_PRIVATE_SELECT_DICE_ACTION,
            "cancel" => ST_PRIVATE_SELECT_DICE_ACTION,
            "zombiePass" => ST_MULTIPLAYER_SWAP,
        ],
    ],

    ST_PRIVATE_REROLL_IMMEDIATE => [
        "name" => "privateRerollImmediate",
        "descriptionmyturn" => clienttranslate('${you} can select a die to reroll with the pink die'),
        "type" => "private",
        "args" => "argRerollImmediate",
        "possibleactions" => [ 
            "rerollImmediate",
        ],
        "transitions" => [
            "rerollImmediate" => ST_PRIVATE_REROLL_IMMEDIATE,
            "selectDice" => ST_PRIVATE_SELECT_DICE_ACTION,
            "zombiePass" => ST_MULTIPLAYER_SWAP,
        ],
    ],

    ST_PRIVATE_CHANGE_DIE => [
        "name" => "privateChangeDie",
        "descriptionmyturn" => clienttranslate('Select 1 die to change'),
        "type" => "private",
        "args" => "argRollDiceForPlayer",
        "possibleactions" => [ 
            "changeDie", 
            "cancel",
        ],
        "transitions" => [
            "selectDice" => ST_PRIVATE_SELECT_DICE_ACTION,
            "cancel" => ST_PRIVATE_SELECT_DICE_ACTION,
            "zombiePass" => ST_MULTIPLAYER_SWAP,
        ],
    ],

    ST_MULTIPLAYER_SWAP => [
        "name" => "swapMulti",
        "description" => clienttranslate("Players with Malac'h can swap one companion with his special deck"),
        "descriptionmyturn" => clienttranslate('${you} can swap one of your companion with this card'),
        "type" => "multipleactiveplayer",
        "initialprivate" => ST_PRIVATE_SWAP,
        "action" => "stSwap",
        "args" => "argSwap",
        "possibleactions" => [],
        "transitions" => [
            "next" => ST_MULTIPLAYER_RESURRECT,
            "zombiePass" => ST_MULTIPLAYER_RESURRECT,
        ],
    ],

    ST_PRIVATE_SWAP => [
        "name" => "swap",
        "descriptionmyturn" => clienttranslate('${you} can swap one of your companion with this card'),
        "type" => "private",
        "args" => "argSwap",
        "possibleactions" => [ 
            "swap", 
            "skipSwap", 
        ],
        "transitions" => [
            "stay" => ST_PRIVATE_SWAP,
            "selectSketalDie" => ST_PRIVATE_SELECT_SKETAL_DIE,
            "zombiePass" => ST_MULTIPLAYER_RESURRECT,
        ],
    ],

    ST_MULTIPLAYER_RESURRECT => [
        "name" => "resurrectMulti",
        "description" => clienttranslate('Players with Cromaug can take a companion from the cemetery'),
        "descriptionmyturn" => clienttranslate('${you} can take a companion from the cemetery'),
        "type" => "multipleactiveplayer",
        "initialprivate" => ST_PRIVATE_RESURRECT,
        "action" => "stResurrect",
        "args" => "argResurrect",
        "possibleactions" => [],
        "transitions" => [
            "next" => ST_MULTIPLAYER_PRIVATE_RESOLVE_CARDS,
            "zombiePass" => ST_MULTIPLAYER_PRIVATE_RESOLVE_CARDS,
        ],
    ],

    ST_PRIVATE_RESURRECT => [
        "name" => "resurrect",
        "descriptionmyturn" => clienttranslate('${you} can take a companion from the cemetery'),
        "type" => "private",
        "args" => "argResurrect",
        "possibleactions" => [ 
            "resurrect", 
            "skipResurrect", 
        ],
        "transitions" => [
            "selectSketalDie" => ST_PRIVATE_SELECT_SKETAL_DIE,
            "zombiePass" => ST_MULTIPLAYER_PRIVATE_RESOLVE_CARDS,
        ],
    ],

    ST_PRIVATE_SELECT_SKETAL_DIE => [
        "name" => "selectSketalDieMulti",
        "description" => clienttranslate('${actplayer} must choose a new die'),
        "descriptionmyturn" => clienttranslate('${you} must choose a new die'),
        "type" => "private",
        "args" => "argSelectSketalDie",
        "possibleactions" => [ 
            "selectSketalDie",
        ],
        "transitions" => [
            "zombiePass" => ST_MULTIPLAYER_PRIVATE_RESOLVE_CARDS,
        ]
    ],

    ST_MULTIPLAYER_PRIVATE_RESOLVE_CARDS => [
        "name" => "multiResolveCards",
        "description" => clienttranslate('Players must resolve their cards'),
        "descriptionmyturn" => clienttranslate('${you} must resolve your cards (select the card to resolve first)'),
        "descriptiondiscardDie" => clienttranslate('Choose a die to discard'),
        "type" => "multipleactiveplayer",
        "initialprivate" => ST_PRIVATE_RESOLVE_CARDS,
        "action" => "stMultiResolveCards",
        "possibleactions" => [],
        "transitions" => [
            "move" => ST_MULTIPLAYER_PRIVATE_MOVE,
            "zombiePass" => ST_MULTIPLAYER_PRIVATE_MOVE,
        ],
    ],

    ST_PRIVATE_RESOLVE_CARDS => [
        "name" => "privateResolveCards",
        "descriptionmyturn" => clienttranslate('${you} must resolve your cards (select the card to resolve first)'),
        "descriptiondiscardDie" => clienttranslate('Choose a die to discard'),
        "type" => "private",
        "args" => "argResolveCardsForPlayer",
        "possibleactions" => [ 
            "resolveCard", 
            "resolveAll", 
        ],
        "transitions" => [
            "resolve" => ST_PRIVATE_RESOLVE_CARDS,
            "zombiePass" => ST_MULTIPLAYER_PRIVATE_MOVE,
        ],
    ],

    ST_MULTIPLAYER_PRIVATE_MOVE => [
        "name" => "multiMove",
        "description" => clienttranslate('Players can move their company'),
        "descriptionboat" => clienttranslate('Players can move one of their boats'),
        "descriptionmyturn" => clienttranslate('${you} can move your company'),
        "descriptionmyturnboat" => clienttranslate('${you} can move one of your boats'),
        "descriptiondiscard" => clienttranslate('Choose a companion or spell to discard'),
        "type" => "multipleactiveplayer",
        "initialprivate" => ST_PRIVATE_MOVE,
        "action" => "stMultiMove",
        "possibleactions" => [],
        "transitions" => [
            "endRound" => ST_END_ROUND,
            "zombiePass" => ST_END_ROUND,
        ],
    ],

    ST_PRIVATE_MOVE => [
        "name" => "privateMove",
        "descriptionmyturn" => clienttranslate('${you} can move your company'),
        "descriptionmyturnboat" => clienttranslate('${you} can move one of your boats'),
        "descriptiondiscard" => clienttranslate('Choose a companion or spell to discard'),
        "type" => "private",
        "args" => "argMoveForPlayer",
        "possibleactions" => [ 
            "move", 
            "placeEncampment",
            "endTurn",
        ],
        "transitions" => [
            "move" => ST_PRIVATE_MOVE,
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

    ST_END_RECRUIT => [ // it's also here dice are rolled
        "name" => "endRecruit",
        "description" => "",
        "type" => "game",
        "action" => "stEndRecruit",
        "transitions" => [ 
            "" => ST_MULTIPLAYER_CHANGE_DICE,
        ],
    ],

    ST_END_ROUND => [
        "name" => "endRound",
        "description" => "",
        "type" => "game",
        "action" => "stEndRound",
        "transitions" => [ 
            "newRound" => ST_START_ROUND,
            "endScore" => ST_END_SCORE
        ],
    ],

    ST_END_SCORE => [
        "name" => "endScore",
        "description" => "",
        "type" => "game",
        "action" => "stEndScore",
        "transitions" => [ 
            "endGame" => ST_END_GAME
        ],
    ],
];
 
$machinestates = $basicGameStates + $playerActionsGameStates + $gameGameStates;
