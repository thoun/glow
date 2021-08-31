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

$this->EFFECTS = [
  1 => new Effect([1, 1], [-105]),
  2 => new Effect([2, 2], [-105]),
  3 => new Effect([3, 3], [33]),
  4 => new Effect([4, 4], [-106]),
  5 => new Effect([5, 5], [-23]),
  6 => new Effect([0, 0, 0], [-107], 2),
];
