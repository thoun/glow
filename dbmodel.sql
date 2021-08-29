
-- ------
-- BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
-- Glow implementation : © <Your name here> <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- dbmodel.sql

-- This is the file where you are describing the database schema of your game
-- Basically, you just have to export from PhpMyAdmin your table structure and copy/paste
-- this export here.
-- Note that the database itself and the standard tables ("global", "stats", "gamelog" and "player") are
-- already created and must not be created here

-- Note: The database schema is created from this file when the game starts. If you modify this file,
--       you have to restart a game to see your changes in database.

CREATE TABLE IF NOT EXISTS `dice` (
  `die_id` TINYINT unsigned NOT NULL AUTO_INCREMENT,
  `die_value` TINYINT unsigned NOT NULL DEFAULT 0,
  `color` TINYINT unsigned NOT NULL DEFAULT 0,
  `small` TINYINT unsigned NOT NULL DEFAULT false,
  `location` varchar(16) NOT NULL DEFAULT 'deck',
  `location_arg` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`die_id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `adventurer` (
  `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `card_type` int(1) NOT NULL,
  `card_type_arg` int(1) NULL,
  `card_location` varchar(16) NOT NULL,
  `card_location_arg` int(11) NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `companion` (
  `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `card_type` int(1) NOT NULL,
  `card_type_arg` int(2) NOT NULL,
  `card_location` varchar(16) NOT NULL,
  `card_location_arg` int(11) NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `effect` (
  `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `card_type` int(1) NOT NULL,
  `card_type_arg` int(1) NULL,
  `card_location` varchar(16) NOT NULL,
  `card_location_arg` int(11) NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

ALTER TABLE `player` ADD `player_rerolls` TINYINT UNSIGNED NOT NULL DEFAULT '0';
ALTER TABLE `player` ADD `player_footprints` TINYINT UNSIGNED NOT NULL DEFAULT '0';
ALTER TABLE `player` ADD `player_fireflies` TINYINT UNSIGNED NOT NULL DEFAULT '0';

-- TODO spell tokens
