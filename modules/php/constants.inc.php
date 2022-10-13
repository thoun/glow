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
define('ST_NEXT_PLAYER_RECRUIT_COMPANION', 28);
define('ST_END_RECRUIT', 29);

// late morning
define('ST_MULTIPLAYER_ROLL_DICE', 30);

// just before noon (Cromaug)
define('ST_MULTIPLAYER_RESURRECT', 35);
define('ST_MULTIPLAYER_PLAYER_SELECT_SKETAL_DIE', 36);
// noon
define('ST_MULTIPLAYER_RESOLVE_CARDS', 40);
define('ST_MULTIPLAYER_PRIVATE_RESOLVE_CARDS', 41);
define('ST_PRIVATE_RESOLVE_CARDS', 42);

// afternoon
define('ST_MULTIPLAYER_MOVE', 50);
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

/*
 * Options
 */
define('BOARD_SIDE', 'BOARD_SIDE');
define('RANDOM_ADVENTURERS', 'RANDOM_ADVENTURERS');

/*
 * Cards
 */
define('KAAR', 20);
define('XARGOK', 10);
define('COMPANION_SPELL', 3);

?>
