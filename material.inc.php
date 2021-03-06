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
 * material.inc.php
 *
 * Glow game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */

require_once(__DIR__.'/modules/php/objects/map-spot.php');

$this->DICES = [
  // color is the key, then large number and small number
  1 => [3, 2], // green
  2 => [3, 2], // blue
  3 => [3, 2], // azure
  4 => [4, 1], // red
  5 => [3, 1], // orange
  6 => [2, 1], // purple
  7 => [2, 0], // yellow
  8 => [0, 1], // black
];

$this->ADVENTURERS = [ // (string $name, int $points, int $dice, $effect)
  1 => new AdventurerCard('Braccio', 1, 2, new Effect([1, 1], [21, 103])),
  2 => new AdventurerCard('Taetyss', 0, 2, new Effect([3, 2], [30, 103])),
  3 => new AdventurerCard('Eoles', 4, 2, new Effect([3, 5], [11, 102])),
  4 => new AdventurerCard('Pocana', 4, 3, null),
  5 => new AdventurerCard('Moloc\'h', 3, 2, new Effect([5], [21])),
  6 => new AdventurerCard('Noctiluca', 0, 2, new Effect([0, 0, 0], [105])),
  7 => new AdventurerCard('Orium', 0, 2, new Effect([0, 0], [101])),
];

$this->COMPANIONS = [ // (string $name, int $points, $effect, bool $reroll, int $fireflies, bool $die, int $dieColor)
  // A
  1 => new CompanionCard('Likyar', 0, new Effect([1, 4], [30, 101]), false, 2),
  2 => new CompanionCard('Thoape', 0, new Effect([2, 5], [11, 102])),
  3 => new CompanionCard('Torke', 0, new Effect([0, 0, 0], [104])),
  4 => new CompanionCard('Tamnuca', 0, new Effect([5], [101]), false, 1),
  5 => new CompanionCard('Ladawa', 0, new Effect([4, 4], [104]), false, 1),
  6 => new CompanionCard('Mindaroo', 0, new Effect([-1, -2], [104]), false, 2),
  7 => new CompanionCard('Mindaroo', 0, new Effect([-3, -4], [106])),
  8 => new CompanionCard('Donillilu', 0, new Effect([-2], [30, 102])),
  9 => new CompanionCard('Oshra', 0, new Effect([-1], [103])),
  10 => new CompanionCard('Xar\'gok', -1, new Effect([4, 4], [33, 36])),
  11 => new CompanionCard('Briki', 6, new Effect([2, 2], [33, 21])),
  12 => new CompanionCard('Briki', 5, new Effect([3, 4], [33, 22])),
  13 => new CompanionCard('Sketal', 1, new Effect([2, 2, 2], [33, -104]), false, 0, true, 5),
  14 => new CompanionCard('Sketal', 1, new Effect([1, 1, 1], [33, -104]), false, 0, true, 3),
  15 => new CompanionCard('Sketal', 0, new Effect([5, 5], [33, 102]), false, 0, true, 1),
  16 => new CompanionCard('Sketal', 1, new Effect([4, 4, 4], [33, -105]), false, 0, true, 2),
  17 => new CompanionCard('Sketal', 1, new Effect([3, 3, 3], [33, -104]), false, 0, true, 4),
  18 => new CompanionCard('Lumipili', 0, new Effect([1, 1], [33, 22]), true),
  19 => new CompanionCard('Snarexe', 0, new Effect([0, 0, 0, 0], [33, 110]), false, 1),
  20 => new CompanionCard('Kaar', 4, null),
  21 => new CompanionCard('Hymoros', -2, new Effect([2], [21]), false, 1),
  22 => new CompanionCard('Dvol', -5, new Effect([3], [21, 101])),
  23 => new CompanionCard('Okans', -2, new Effect([1], [30, 101])),
  // B
  24 => new CompanionCard('Brikix', 4, new Effect([5, 5, 5], [33]), false, 1),
  25 => new CompanionCard('Zzibelu', 0, new Effect([3, 5], [105]), false, 1),
  26 => new CompanionCard('Torke', 0, new Effect([0, 0], [102]), false, 1),
  27 => new CompanionCard('Torkos', 2, new Effect([0, 0, 0], [106])),
  28 => new CompanionCard('Wapoki', 2, new Effect([1, 2], [11, 102]), false, 1),
  29 => new CompanionCard('Tamnuca', 2, new Effect([5], [21])),
  30 => new CompanionCard('Zellyf', 5, new Effect([2, 2], [-102])),
  31 => new CompanionCard('Zellyf', 0, new Effect([2], [103])),
  32 => new CompanionCard('Biraii', 1, new Effect([4], [11, 101]), false, 1),
  33 => new CompanionCard('Biraii', 0, new Effect([4], [11, 21]), false, 2),
  34 => new CompanionCard('Dvol', 4, new Effect([3, 3, 3], [103])),
  35 => new CompanionCard('Dvol', 3, new Effect([3], [101])),
  36 => new CompanionCard('Okanios', 3, new Effect([1, 1, 1], [105])),
  37 => new CompanionCard('Gluach', 0, new Effect([2, -5], [106]), false, 2),
  38 => new CompanionCard('Drel', 3, new Effect([-4], [102])),
  39 => new CompanionCard('Oshra', 2, new Effect([-5], [103]), false, 1),
  40 => new CompanionCard('Drel', 2, new Effect([-3], [104])),
  41 => new CompanionCard('Cromaug', -1, new Effect([3], [33, 35])),
  42 => new CompanionCard('Kapaoro', 5, new Effect([0, 0, 0], [33])),
  43 => new CompanionCard('Kapao', 5, new Effect([3, 3], [33])),
  44 => new CompanionCard('Sketal', 2, new Effect([1, 1], [33, 22]), false, 0, true, 0),
  45 => new CompanionCard('Lumipili', 1, new Effect([4, 4], [33, 106]), true),
  46 => new CompanionCard('Kapao', 4, new Effect([2, 2], [33, 22])),
];

$this->REMOVED_COMPANION_FOR_SOLO = [
  // A
  1, 3, 10, 12, 20, 21, 9,
  // B
  25, 33, 38, 41, 44, 46, 34,
];

$this->SPELLS = [
  1 => new SpellCard(new Effect([1, 1], [-105])),
  2 => new SpellCard(new Effect([2, 2], [-105])),
  3 => new SpellCard(new Effect([3, 3], [33])),
  4 => new SpellCard(new Effect([4, 4], [-106])),
  5 => new SpellCard(new Effect([5, 5], [-23])),
  6 => new SpellCard(new Effect([0, 0, 0], [-107]), 2),
];

$this->SOLO_TILES = [
  1 => new SoloTileCard(2),
  2 => new SoloTileCard(2, 0, 1),
  3 => new SoloTileCard(3),
  4 => new SoloTileCard(2, 1, 2),
  5 => new SoloTileCard(1, 2, 1),
  6 => new SoloTileCard(2, 3, 2),
  7 => new SoloTileCard(0, 4, 1),
  8 => new SoloTileCard(1, 5, 2),
];

$this->SCORE_TRACK_REROLLS = [0, 1, 2, 3, 4, 5, 7, 9, 11, 13, 16, 19, 22, 26, 31, 37, 44, 52];

$this->MAP1 = [
  new MapSpot1(0, [], [
    new MapRoute(1),
    new MapRoute(44),
  ]),
  new MapSpot1(1, [4], [
    new MapRoute(2),
  ]),
  new MapSpot1(2, [4], [
    new MapRoute(3),
    new MapRoute(45),
  ]),
  new MapSpot1(3, [4], [
    new MapRoute(4),
  ]),
  new MapSpot1(4, [2], [
    new MapRoute(5),
  ]),
  new MapSpot1(5, [-21, 11], [
    new MapRoute(6),
    new MapRoute(51),
  ], 5, true),
  new MapSpot1(6, [2], [
    new MapRoute(7),
  ]),
  new MapSpot1(7, [1], [
    new MapRoute(8),
  ]),
  new MapSpot1(8, [-4], [
    new MapRoute(9),
    new MapRoute(32),
  ]),
  new MapSpot1(9, [3], [
    new MapRoute(10),
  ]),
  new MapSpot1(10, [3], [
    new MapRoute(11, [11]),
  ]),
  new MapSpot1(11, [-2], [
    new MapRoute(12, [-105]),
    new MapRoute(15),
  ]),
  new MapSpot1(12, [5], [
    new MapRoute(13),
    new MapRoute(22),
  ]),
  new MapSpot1(13, [5], [
    new MapRoute(14),
  ]),
  new MapSpot1(14, [-23], [], 20, true),
  new MapSpot1(15, [1], [
    new MapRoute(16, [37]),
    new MapRoute(18),
  ]),
  new MapSpot1(16, [3], [
    new MapRoute(17),
  ]),
  new MapSpot1(17, [-21], [
    new MapRoute(18),
    new MapRoute(27),
  ], 12, true),
  new MapSpot1(18, [1], [
    new MapRoute(19),
  ]),
  new MapSpot1(19, [3], [
    new MapRoute(20),
    new MapRoute(26, [30]),
  ]),
  new MapSpot1(20, [3], [
    new MapRoute(21),
  ]),
  new MapSpot1(21, [5], [
    new MapRoute(22),
  ]),
  new MapSpot1(22, [-1], [
    new MapRoute(23, [30]),
  ]),
  new MapSpot1(23, [5], [
    new MapRoute(24),
  ]),
  new MapSpot1(24, [-3], [
    new MapRoute(25),
    new MapRoute(43),
  ]),
  new MapSpot1(25, [5], [
    new MapRoute(26),
  ]),
  new MapSpot1(26, [3], [
    new MapRoute(28),
  ]),
  new MapSpot1(27, [4], [
    new MapRoute(28),
  ]),
  new MapSpot1(28, [3], [
    new MapRoute(29),
    new MapRoute(39),
  ]),
  new MapSpot1(29, [4], [
    new MapRoute(30),
  ]),
  new MapSpot1(30, [4], [
    new MapRoute(31),
    new MapRoute(36),
    new MapRoute(37),
  ]),
  new MapSpot1(31, [2], [
    new MapRoute(33),
  ]),
  new MapSpot1(32, [2], [
    new MapRoute(33),
  ]),
  new MapSpot1(33, [11, -21], [
    new MapRoute(34),
  ], 8, true),
  new MapSpot1(34, [2], [
    new MapRoute(35),
  ]),
  new MapSpot1(35, [2], [
    new MapRoute(36),
    new MapRoute(50),
    new MapRoute(52),
  ]),
  new MapSpot1(36, [4], []),
  new MapSpot1(37, [-5], [
    new MapRoute(38),
  ]),
  new MapSpot1(38, [30, -21], [
    new MapRoute(39),
    new MapRoute(40),
  ], 10, true),
  new MapSpot1(39, [5], []),
  new MapSpot1(40, [1], [
    new MapRoute(41, [37]),
    new MapRoute(53),
  ]),
  new MapSpot1(41, [-2], [
    new MapRoute(42),
  ]),
  new MapSpot1(42, [5], [
    new MapRoute(43),
  ]),
  new MapSpot1(43, [-22], [], 15, true),
  new MapSpot1(44, [1], [
    new MapRoute(45),
  ]),
  new MapSpot1(45, [1], [
    new MapRoute(46),
    new MapRoute(60),
  ]),
  new MapSpot1(46, [1], [
    new MapRoute(47),
  ]),
  new MapSpot1(47, [1], [
    new MapRoute(48),
  ]),
  new MapSpot1(48, [2], [
    new MapRoute(49),
    new MapRoute(58),
  ]),
  new MapSpot1(49, [2], [
    new MapRoute(50),
  ]),
  new MapSpot1(50, [2], [
    new MapRoute(51),
  ]),
  new MapSpot1(51, [-1], []),
  new MapSpot1(52, [3], [
    new MapRoute(54, [12]),
  ]),
  new MapSpot1(53, [1], [
    new MapRoute(54),
  ]),
  new MapSpot1(54, [1], [
    new MapRoute(55),
  ]),
  new MapSpot1(55, [4], [
    new MapRoute(56),
  ]),
  new MapSpot1(56, [-4], [
    new MapRoute(57),
  ]),
  new MapSpot1(57, [-5], [
    new MapRoute(59),
  ]),
  new MapSpot1(58, [-3], [
    new MapRoute(59),
  ]),
  new MapSpot1(59, [-21, 30], [
    new MapRoute(60),
  ], 3, true),
  new MapSpot1(60, [3], []),
];

$this->MAP2 = [
  new MapSpot2(0, [], [
    new MapRoute(1, [], 1, 2),
    new MapRoute(3, [], 3),
    new MapRoute(6, [], 1, 2),    
    new MapRoute(8, [], 3),
    new MapRoute(10, [], 4),
  ], 0, 0),
  new MapSpot2(1, [22], [
    new MapRoute(2),
  ], 0, -1),
  new MapSpot2(2, [37], [
  ], 0, -1),
  new MapSpot2(3, [12], [
    new MapRoute(4, [], 1, 2),
    new MapRoute(5, [-21], 5),
  ], 0, 1),
  new MapSpot2(4, [21], [
  ], 5, 2),
  new MapSpot2(5, [], [
    new MapRoute(6, [-21], 5),
  ], 4, 2),
  new MapSpot2(6, [30], [
    new MapRoute(7, [], 4),
  ], 2, 1),
  new MapSpot2(7, [30], [
    new MapRoute(8, [], 4),
  ], 2, 2),
  new MapSpot2(8, [], [
    new MapRoute(9, [-21], 1, 2),
  ], 0, 1),
  new MapSpot2(9, [], [
    new MapRoute(10, [-21], 1, 2),
  ], 8, 2),
  new MapSpot2(10, [30], [
    new MapRoute(11, [], 5),
  ], 0, 1),
  new MapSpot2(11, [37], [
  ], 3, 2),
];

$this->MAPS = [
  1 => $this->MAP1,
  2 => $this->MAP2,
];

$this->ADVENTURERS_COLORS = [  
  1 => '00995c',
  2 => '0077ba',
  3 => '57cbf5',
  4 => 'bf1e2e',
  5 => 'ea7d28',
  6 => '8a298a',
  7 => 'ffd503',
];
