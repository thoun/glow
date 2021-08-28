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

$this->ADVENTURERS = [ // (int $points, int $dice, int $effect) TODO effects 
  1 => new AdventurerCard(1, 2, 0),
  2 => new AdventurerCard(0, 2, 0),
  3 => new AdventurerCard(4, 2, 0),
  4 => new AdventurerCard(4, 3, 0),
  5 => new AdventurerCard(3, 2, 0),
  6 => new AdventurerCard(0, 2, 0),
  7 => new AdventurerCard(0, 2, 0),
];