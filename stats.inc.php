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
 * stats.inc.php
 *
 * Glow game statistics description
 *
 */

/*
    In this file, you are describing game statistics, that will be displayed at the end of the
    game.
    
    !! After modifying this file, you must use "Reload  statistics configuration" in BGA Studio backoffice
    ("Control Panel" / "Manage Game" / "Your Game")
    
    There are 2 types of statistics:
    _ table statistics, that are not associated to a specific player (ie: 1 value for each game).
    _ player statistics, that are associated to each players (ie: 1 value for each player in the game).

    Statistics types can be "int" for integer, "float" for floating point values, and "bool" for boolean
    
    Once you defined your statistics there, you can start using "initStat", "setStat" and "incStat" method
    in your game logic, using statistics names defined below.
    
    !! It is not a good idea to modify this file when a game is running !!

    If your game is already public on BGA, please read the following before any change:
    http://en.doc.boardgamearena.com/Post-release_phase#Changes_that_breaks_the_games_in_progress
    
    Notes:
    * Statistic index is the reference used in setStat/incStat/initStat PHP method
    * Statistic index must contains alphanumerical characters and no space. Example: 'turn_played'
    * Statistics IDs must be >=10
    * Two table statistics can't share the same ID, two player statistics can't share the same ID
    * A table statistic can have the same ID than a player statistics
    * Statistics ID is the reference used by BGA website. If you change the ID, you lost all historical statistic data. Do NOT re-use an ID of a deleted statistic
    * Statistic name is the English description of the statistic as shown to players
    
*/

$commonStats = [
    "collectedSmallDice" => [
        "id" => 11,
        "name" => totranslate("Collected small dice"),
        "type" => "int"
    ],
    "rerolledDice" => [
        "id" => 12,
        "name" => totranslate("Rerolled dice"),
        "type" => "int"
    ],
    "changedDice" => [
        "id" => 13,
        "name" => totranslate("Changed dice"),
        "type" => "int"
    ],
    "scoreBack" => [
        "id" => 14,
        "name" => totranslate("Score track cases back to get reroll"),
        "type" => "int"
    ],
    "resolvedCards" => [
        "id" => 15,
        "name" => totranslate("Resolved cards"),
        "type" => "int"
    ],
    "discardedCompanions" => [
        "id" => 16,
        "name" => totranslate("Discarded companions"),
        "type" => "int"
    ],
    "moves" => [
        "id" => 17,
        "name" => totranslate("Moves"),
        "type" => "int"
    ],
    "footprintsAsJokers" => [
        "id" => 18,
        "name" => totranslate("Footprints used as jokers"),
        "type" => "int"
    ],
];


$ADVENTURERS = [
    1 => 'Braccio',
    2 => 'Taetyss',
    3 => 'Eoles',
    4 => 'Pocana',
    5 => 'Moloc\'h',
    6 => 'Noctiluca',
    7 => 'Orium',
    8 => 'Richard',
    9 => 'Malac\'h',
    10 => 'Kaploum',
    11 => 'Uriom',
];

foreach($ADVENTURERS as $id => $adventurer) {
    $commonStats[$adventurer] = [
        "id" => 50+$id,
        "name" => $adventurer,
        "type" => "bool"
    ];
}

$stats_type = [

    // Statistics global to table
    "table" => $commonStats + [
        "days" => [
            "id" => 10,
            "name" => totranslate("Days"),
            "type" => "int"
        ], 
    ],
    
    // Statistics existing for each player
    "player" => $commonStats + [
        "cardsEndPoints" => [
            "id" => 20,
            "name" => totranslate("Points gained with adventurers and companions"),
            "type" => "int"
        ],
        "meepleEndPoints" => [
            "id" => 21,
            "name" => totranslate("Points gained with encampment or boats"),
            "type" => "int"
        ],
        "endFirefliesTokens" => [
            "id" => 22,
            "name" => totranslate("Fireflies tokens"),
            "type" => "int"
        ],
        "endCompanionCount" => [
            "id" => 23,
            "name" => totranslate("Companion count"),
            "type" => "int"
        ],
        "endFirefliesBonus" => [
            "id" => 24,
            "name" => totranslate("Fireflies bonus"),
            "type" => "bool"
        ],
        "endFootprintsCount" => [
            "id" => 25,
            "name" => totranslate("Points gained with footprints"),
            "type" => "int"
        ],
    ]
];
