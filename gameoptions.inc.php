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
 * gameoptions.inc.php
 *
 * Glow game options description
 * 
 * In this file, you can define your game options (= game variants).
 *   
 * Note: If your game has no variant, you don't have to modify this file.
 *
 * Note²: All options defined in this file should have a corresponding "game state labels"
 *        with the same ID (see "initGameStateLabels" in glow.game.php)
 *
 * !! It is not a good idea to modify this file when a game is running !!
 *
 */

require_once 'modules/php/constants.inc.php';

$game_options = [

    /* note: game variant ID should start at 100 (ie: 100, 101, 102, ...). The maximum is 199.*/
    100 => [
        'name' => totranslate('Side of the board'),
        'values' => [
            1 => [
                'name' => totranslate('The Province of Shadows'),
                'tmdisplay' => totranslate('The Province of Shadows'),
            ],
            2 => [
                'name' => totranslate('The Archipelago of Darkness'), 
                'tmdisplay' => totranslate('The Archipelago of Darkness'), 
            ],
        ],
        'default' => 1,
        'level' => 'major',
    ],

    101 => [
        'name' => totranslate('Random adventurers'),
        'values' => [
            1 => [
                'name' => totranslate('Disabled'),
            ],
            2 => [
                'name' => totranslate('Enabled'), 
                'tmdisplay' => totranslate('Random adventurers'), 
            ],
        ],
        'default' => 1,
    ],

    OPTION_EXPANSION => [
        'name' => totranslate('Expansion'),
        'values' => [
            1 => [
                'name' => totranslate('Disabled'),
            ],
            2 => [
                'name' => totranslate('Enabled'),
                'tmdisplay' => totranslate('Expansion'),
                'alpha' => true,
            ],
        ],
        'default' => 2,
        'startcondition' => [
            1 => [
                [
                    'type' => 'maxplayers',
                    'value' => 4,
                    'message' => totranslate('You can only player with 5-6 players if the expansion is activated'),
                ]
            ],
            2 => [],
        ],
    ],

    OPTION_EXPANSION_MODULE1 => [
        'name' => totranslate('Expansion module 1'),
        'values' => [
            1 => [
                'name' => totranslate('Disabled'),
            ],
            2 => [
                'name' => totranslate('Enabled'),
                'tmdisplay' => totranslate('Expansion module 1'),
                'alpha' => true,
            ],
        ],
        'default' => 1,
        'displaycondition' => [
            [
              'type' => 'otheroption',
              'id' => OPTION_EXPANSION,
              'value' => [2],
            ],
            /*[
              'type' => 'minplayers',
              'value' => [2],
            ],*/
          ],
    ],

    OPTION_EXPANSION_MODULE2 => [
        'name' => totranslate('Expansion module 2'),
        'values' => [
            1 => [
                'name' => totranslate('Disabled'),
            ],
            2 => [
                'name' => totranslate('Enabled'),
                'tmdisplay' => totranslate('Expansion module 2'),
                'alpha' => true,
            ],
        ],
        'default' => 1,
        'displaycondition' => [
            [
              'type' => 'otheroption',
              'id' => OPTION_EXPANSION,
              'value' => [2],
            ],
          ],
    ],

    OPTION_EXPANSION_MODULE3 => [
        'name' => totranslate('Expansion module 3'),
        'values' => [
            1 => [
                'name' => totranslate('Disabled'),
            ],
            2 => [
                'name' => totranslate('Enabled'),
                'tmdisplay' => totranslate('Expansion module 3'),
                'alpha' => true,
            ],
        ],
        'default' => 1,
        'displaycondition' => [
            [
              'type' => 'otheroption',
              'id' => OPTION_EXPANSION,
              'value' => [2],
            ],
            /*[
              'type' => 'minplayers',
              'value' => [2],
            ],*/
          ],
    ],
];

$game_preferences = [
    201 => [
        'name' => totranslate('Show color-blind indications'),
        'needReload' => true,
        'values' => [
            1 => [ 'name' => totranslate('Enabled')],
            2 => [ 'name' => totranslate('Disabled')],
        ],
        'default' => 2
    ],

    202 => [
        'name' => totranslate('Bursts of light : higher contrast'),
        'needReload' => false,
        'values' => [
            1 => [ 'name' => totranslate('Disabled')],
            2 => [ 'name' => totranslate('Enabled for cards only')],
            3 => [ 'name' => totranslate('Enabled for cards and map')],
        ],
        'default' => 2
    ],
    
    203 => [
        'name' => totranslate('Countdown timer when no action is possible'),
        'needReload' => false,
        'values' => [
            1 => ['name' => totranslate('Enabled')],
            2 => ['name' => totranslate('Disabled')],
        ],
        'default' => 1,
    ],
    
];