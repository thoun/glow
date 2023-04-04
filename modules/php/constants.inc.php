<?php

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);

define('ST_PREPARE_ADVENTURER_CHOICE', 5);

define('ST_PLAYER_CHOOSE_ADVENTURER', 10);
define('ST_NEXT_PLAYER_CHOOSE_ADVENTURER', 11);
define('ST_PLAYER_CHOOSE_TOM_DICE', 12);

define('ST_START_ROUND', 15);

// morning
define('ST_PLAYER_RECRUIT_COMPANION', 20);
define('ST_PLAYER_REMOVE_COMPANION', 21);
define('ST_PLAYER_SELECT_SKETAL_DIE', 22);
define('ST_PLAYER_MOVE_BLACK_DIE', 23);
define('ST_PLAYER_URIOM_RECRUIT_COMPANION', 25);
define('ST_NEXT_PLAYER_RECRUIT_COMPANION', 28);
define('ST_END_RECRUIT', 29);

// late morning
define('ST_MULTIPLAYER_CHANGE_DICE', 31);
define('ST_PRIVATE_SELECT_DICE_ACTION', 32);
define('ST_PRIVATE_ROLL_DICE', 331);
define('ST_PRIVATE_CHANGE_DIE', 332);
define('ST_PRIVATE_REROLL_IMMEDIATE', 333);

// just before noon (Malach & Cromaug)
define('ST_MULTIPLAYER_SWAP', 34);
define('ST_PRIVATE_SWAP', 341);
define('ST_MULTIPLAYER_RESURRECT', 35);
define('ST_PRIVATE_RESURRECT', 351);
define('ST_PRIVATE_SELECT_SKETAL_DIE', 36);
// noon
define('ST_MULTIPLAYER_PRIVATE_RESOLVE_CARDS', 41);
define('ST_PRIVATE_RESOLVE_CARDS', 42);
define('ST_PRIVATE_REMOVE_TOKEN', 44);

// afternoon
define('ST_MULTIPLAYER_PRIVATE_MOVE', 51);
define('ST_PRIVATE_MOVE', 52);

//Evening
define('ST_END_ROUND', 80);
define('ST_END_SCORE', 90);

define('ST_END_GAME', 99);
define('END_SCORE', 100);

/*
 * Variables
 */
define('DAY', 'DAY');
define('FIRST_PLAYER', 'FIRST_PLAYER');
define('SOLO_DECK', 'SOLO_DECK');
define('MARTY_POSITION', 'MARTY_POSITION');

/*
 * Global Variables
 */
define('TOM', 'TOM');
define('URIOM_INTERVENTION', 'URIOM_INTERVENTION');

/*
 * Options
 */
define('BOARD_SIDE', 'BOARD_SIDE');
define('RANDOM_ADVENTURERS', 'RANDOM_ADVENTURERS');
define('OPTION_EXPANSION', 110);
define('OPTION_EXPANSION_MODULE1', 111);
define('OPTION_EXPANSION_MODULE2', 112);
define('OPTION_EXPANSION_MODULE3', 113);

/*
 * Cards
 */
define('KAAR', 20);
define('XARGOK', 10);
define('MARTY', 107);
define('COMPANION_SPELL', 3);

?>
