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
  20 => new CompanionCard('Kaar', 4, null), // TODO black die
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

$this->SPELLS = [
  1 => new Effect([1, 1], [-105]),
  2 => new Effect([2, 2], [-105]),
  3 => new Effect([3, 3], [33]),
  4 => new Effect([4, 4], [-106]),
  5 => new Effect([5, 5], [-23]),
  6 => new Effect([0, 0, 0], [-107], 2),
];

$this->MEETING_SPOT_BY_COLOR = [
  1 => 5,
  2 => 2,
  3 => 4,
  4 => 1,
  5 => 3,
];

$this->SCORE_TRACK_REROLLS = [0, 1, 2, 3, 4, 5, 7, 9, 11, 13, 16, 19, 22, 26, 31, 36, 44, 52];

$this->MAP1 = [
  new MapSpot(0, [], [
    new MapRoute(1),
    new MapRoute(44),
  ], true),
  new MapSpot(1, [4], [
    new MapRoute(2),
  ]),
  new MapSpot(2, [4], [
    new MapRoute(3),
    new MapRoute(45),
  ]),
  new MapSpot(3, [4], [
    new MapRoute(4),
  ]),
  new MapSpot(4, [2], [
    new MapRoute(5),
  ]),
  new MapSpot(5, [105, -21, 11], [
    new MapRoute(6),
    new MapRoute(51),
  ], true),
  new MapSpot(6, [2], [
    new MapRoute(7),
  ]),
  new MapSpot(7, [1], [
    new MapRoute(8),
  ]),
  new MapSpot(8, [-4], [
    new MapRoute(9),
    new MapRoute(32),
  ]),
  new MapSpot(9, [3], [
    new MapRoute(10),
  ]),
  new MapSpot(10, [3], [
    new MapRoute(11, [11]),
  ]),
  new MapSpot(11, [-2], [
    new MapRoute(12, [-105]),
    new MapRoute(15),
  ]),
  new MapSpot(12, [5], [
    new MapRoute(13),
  ]),
  new MapSpot(13, [4], [
    new MapRoute(14),
  ]),
  new MapSpot(14, [120, -23], [], true),
  new MapSpot(15, [1], [
    new MapRoute(16, [-37]),
    new MapRoute(18),
  ]),
  new MapSpot(16, [3], [
    new MapRoute(17),
  ]),
  new MapSpot(17, [12, -21], [
    new MapRoute(18),
    new MapRoute(27),
  ], true),
  new MapSpot(18, [1], [
    new MapRoute(19),
  ]),
  new MapSpot(19, [3], [
    new MapRoute(20),
  ]),
  new MapSpot(20, [3], [
    new MapRoute(21),
  ]),
  new MapSpot(21, [5], [
    new MapRoute(22),
  ]),
  new MapSpot(22, [-1], [
    new MapRoute(23, [30]),
  ]),
  new MapSpot(23, [5], [
    new MapRoute(24),
  ]),
  new MapSpot(24, [-3], [
    new MapRoute(25),
    new MapRoute(43),
  ]),
  new MapSpot(25, [5], [
    new MapRoute(26),
  ]),
  new MapSpot(26, [3], [
    new MapRoute(28),
  ]),
  new MapSpot(27, [4], [
    new MapRoute(28),
  ]),
  new MapSpot(28, [3], [
    new MapRoute(29),
    new MapRoute(39),
  ]),
  new MapSpot(29, [4], [
    new MapRoute(30),
  ]),
  new MapSpot(30, [4], [
    new MapRoute(31),
    new MapRoute(36),
    new MapRoute(37),
  ]),
  new MapSpot(31, [2], [
    new MapRoute(33),
  ]),
  new MapSpot(32, [2], [
    new MapRoute(33),
  ]),
  new MapSpot(33, [8, 11, -21], [
    new MapRoute(34),
  ], true),
  new MapSpot(34, [2], [
    new MapRoute(35),
  ]),
  new MapSpot(35, [2], [
    new MapRoute(36),
    new MapRoute(50),
    new MapRoute(52),
  ]),
  new MapSpot(36, [4], []),
  new MapSpot(37, [-5], [
    new MapRoute(38),
  ]),
  new MapSpot(38, [110, 30, -21], [
    new MapRoute(39),
    new MapRoute(40),
  ], true),
  new MapSpot(39, [5], []),
  new MapSpot(40, [1], [
    new MapRoute(41, [37]),
    new MapRoute(53),
  ]),
  new MapSpot(41, [-2], [
    new MapRoute(42),
  ]),
  new MapSpot(42, [5], [
    new MapRoute(43),
  ]),
  new MapSpot(43, [115, -22], [], true),
  new MapSpot(44, [1], [
    new MapRoute(45),
  ]),
  new MapSpot(45, [1], [
    new MapRoute(46),
    new MapRoute(60),
  ]),
  new MapSpot(46, [1], [
    new MapRoute(47),
  ]),
  new MapSpot(47, [1], [
    new MapRoute(48),
  ]),
  new MapSpot(48, [2], [
    new MapRoute(49),
    new MapRoute(58),
  ]),
  new MapSpot(49, [2], [
    new MapRoute(50),
  ]),
  new MapSpot(50, [2], [
    new MapRoute(51),
  ]),
  new MapSpot(51, [-1], []),
  new MapSpot(52, [3], [
    new MapRoute(54, [11]),
  ]),
  new MapSpot(53, [1], [
    new MapRoute(54),
  ]),
  new MapSpot(54, [1], [
    new MapRoute(55),
  ]),
  new MapSpot(55, [4], [
    new MapRoute(56),
  ]),
  new MapSpot(56, [-4], [
    new MapRoute(57),
  ]),
  new MapSpot(57, [-5], [
    new MapRoute(59),
  ]),
  new MapSpot(58, [-3], [
    new MapRoute(59),
  ]),
  new MapSpot(59, [103, -21, 30], [
    new MapRoute(60),
  ], true),
  new MapSpot(60, [3], []),
];

$this->MAP2 = [
  new MapSpot(0, [], [
    new MapRoute(1, [], 1, 2),
    new MapRoute(3, [], 3),
    new MapRoute(6, [], 1, 2),    
    new MapRoute(8, [], 3),
    new MapRoute(10, [], 4),
  ]),
  new MapSpot(1, [22], [
    new MapRoute(2),
  ]),
  new MapSpot(2, [37], []),
  new MapSpot(3, [12], [
    new MapRoute(4, [], 1, 2),
    new MapRoute(5, [-21], 5),
  ]),
  new MapSpot(4, [105], [21]),
  new MapSpot(5, [104], [
    new MapRoute(6, [-21], 5),
  ]),
  new MapSpot(6, [102, 30], [
    new MapRoute(7, [], 4),
  ]),
  new MapSpot(7, [102, 30], [
    new MapRoute(8, [], 4),
  ]),
  new MapSpot(8, [], [
    new MapRoute(9, [-21], 1, 2),
  ]),
  new MapSpot(9, [108], [
    new MapRoute(10, [-21], 1, 2),
  ]),
  new MapSpot(10, [30], [
    new MapRoute(11, [], 5),
  ]),
  new MapSpot(11, [103], []),
];

$this->MAPS = [
  1 => $this->MAP1,
  2 => $this->MAP2,
];
