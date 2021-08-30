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
  1 => new AdventurerCard('Braccio', 1, 2, new Effect([1, 1], [21, 13])),
  2 => new AdventurerCard('Taetyss', 0, 2, new Effect([3, 2], [30, 13])),
  3 => new AdventurerCard('Eoles', 4, 2, new Effect([3, 5], [31, 12])),
  4 => new AdventurerCard('Pocana', 4, 3, null),
  5 => new AdventurerCard('Moloc\'h', 3, 2, new Effect([5], [21])),
  6 => new AdventurerCard('Noctiluca', 0, 2, new Effect([0, 0, 0], [15])),
  7 => new AdventurerCard('Orium', 0, 2, new Effect([0, 0], [11])),
];

$this->COMPANIONS = [ // (string $name, int $points, $effect, bool $reroll, int $fireflies, bool $die, int $dieColor)
  // A
  1 => new CompanionCard('Likyar', 0, new Effect([1, 4], [30, 11]), false, 2),
  2 => new CompanionCard('Thoape', 0, new Effect([2, 5], [31, 12])),
  3 => new CompanionCard('Torke', 0, new Effect([0, 0, 0], [14])),
  4 => new CompanionCard('Tamnuca', 0, new Effect([5], [11]), false, 1),
  5 => new CompanionCard('Ladawa', 0, new Effect([4, 4], [14]), false, 1),
  6 => new CompanionCard('Mindaroo', 0, new Effect([-1, -2], [14]), false, 2),
  7 => new CompanionCard('Mindaroo', 0, new Effect([-3, -4], [16])),
  8 => new CompanionCard('Donillilu', 0, new Effect([-2], [30, 12])),
  9 => new CompanionCard('Oshra', 0, new Effect([-1], [13])),
  10 => new CompanionCard('Xar\'gok', -1, new Effect([4, 4], [33, 36])),
  11 => new CompanionCard('Briki', 6, new Effect([2, 2], [33, 21])),
  12 => new CompanionCard('Briki', 5, new Effect([3, 4], [33, 22])),
  13 => new CompanionCard('Sketal', 1, new Effect([2, 2, 2], [33, -14]), false, 0, true, 5),
  14 => new CompanionCard('Sketal', 1, new Effect([1, 1, 1], [33, -14]), false, 0, true, 3),
  15 => new CompanionCard('Sketal', 0, new Effect([5, 5], [33, 12]), false, 0, true, 1),
  16 => new CompanionCard('Sketal', 1, new Effect([4, 4, 4], [33, -15]), false, 0, true, 2),
  17 => new CompanionCard('Sketal', 1, new Effect([3, 3, 3], [33, -14]), false, 0, true, 4),
  18 => new CompanionCard('Lumipili', 0, new Effect([1, 1], [33, 22]), true),
  19 => new CompanionCard('Snarexe', 0, new Effect([0, 0, 0, 0], [33, 10]), false, 1), // TODO 10 -> 10 points !
  20 => new CompanionCard('Kaar', 4, null), // TODO black die
  21 => new CompanionCard('Hymoros', -2, new Effect([2], [21]), false, 1),
  22 => new CompanionCard('Dvol', -5, new Effect([3], [21, 11])),
  23 => new CompanionCard('Okans', -2, new Effect([1], [30, 11])),
  // B
  // TODO
];

// 0 : joker
// 1/5 : color, -1/-5 : forbidden color
// +1x, -1x : points
// +2x, -2x : footprints
// 30 : reroll, 31 firefly, 32 fireflies, 33 skull, 34 black die, 35 resurect, 36 spell

$this->EFFECTS = [
  1 => new Effect([1, 1], [-15]),
  2 => new Effect([2, 2], [-15]),
  3 => new Effect([3, 3], [33]),
  4 => new Effect([4, 4], [-16]),
  5 => new Effect([5, 5], [-23]),
  6 => new Effect([0, 0, 0], [-17], 2),
];
