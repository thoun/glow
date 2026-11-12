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
  * modules/php/Game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */

declare(strict_types=1);

namespace Bga\Games\Glow;

use Bga\GameFramework\Components\Deck;
use Bga\GameFramework\Table;
use Bga\Games\Glow\Models\MeetingTrackSpot;
use Bga\Games\Glow\States\PrepareAdventurerChoice;
use Bga\Games\Glow\Traits\ActionTrait;
use Bga\Games\Glow\Traits\ArgsTrait;
use Bga\Games\Glow\Traits\DebugUtilTrait;
use Bga\Games\Glow\Traits\MapTrait;
use Bga\Games\Glow\Traits\SoloUtilTrait;
use Bga\Games\Glow\Traits\UtilTrait;

require_once __DIR__ . '/constants.inc.php';

class Game extends Table {
    use UtilTrait;
    use ActionTrait;
    use ArgsTrait;
    use MapTrait;

    use SoloUtilTrait;

    use DebugUtilTrait;

    public Deck $adventurers;
    public Deck $companions;
    public Deck $spells;
    public Deck $soloTiles;
    public Deck $tokens;

    public array $DICES;
    public array $DICES_EXPANSION1;
    public array $ADVENTURERS;
    public array $COMPANIONS;
    public array $REMOVED_COMPANION_FOR_SOLO;
    public array $COMPANIONS_EXPANSION1_SETS;
    public array $SPELLS;
    public array $SPELLS_EXPANSION1;
    public array $SOLO_TILES;
    public array $SCORE_TRACK_REROLLS;
    public array $MAP1;
    public array $MAP2;
    public array $MAPS;
    public array $ADVENTURERS_COLORS;
    public array $SMALL_BOARD_COLOR;
    public array $POINTS_FOR_COLOR_TOKENS;

	function __construct() {
        require __DIR__ . '/material.inc.php';

        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        $this->initGameStateLabels([
            DAY => 10,
            FIRST_PLAYER => 11,
            SOLO_DECK => 12,
        ]); 
		
        $this->adventurers = $this->bga->deckFactory->createDeck("adventurer");
		
        $this->companions = $this->bga->deckFactory->createDeck("companion");
		
        $this->spells = $this->bga->deckFactory->createDeck("spells");
		
        $this->soloTiles = $this->bga->deckFactory->createDeck("solotiles");
		
        $this->tokens = $this->bga->deckFactory->createDeck("token");
	}	

    public function getSide(): int {
        return $this->bga->tableOptions->get(BOARD_SIDE) ?? 1;
    }

    public function isRandomAdventurersEnabled(): bool {
        return ($this->bga->tableOptions->get(RANDOM_ADVENTURERS) ?? 1) === 2;
    }

    public function isExpansion(): bool {
        return ($this->bga->tableOptions->get(OPTION_EXPANSION) ?? 2) === 2;
    }

    public function isElementalModuleEnabled(): bool {
        return ($this->bga->tableOptions->get(OPTION_EXPANSION_MODULE1) ?? 1) === 2;
    }

    public function tokensActivated(): bool {
        return ($this->bga->tableOptions->get(OPTION_EXPANSION_MODULE2) ?? 1) === 2;
    }

    public function isDraconicModuleEnabled(): bool {
        return ($this->bga->tableOptions->get(OPTION_EXPANSION_MODULE3) ?? 1) === 2;
    }

    public function isExpansionModuleEnabled(int $moduleNumber): bool {
        return match ($moduleNumber) {
            1 => $this->isElementalModuleEnabled(),
            2 => $this->tokensActivated(),
            3 => $this->isDraconicModuleEnabled(),
        };
    }

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame($players, $options = []) { 
        $isExpansion = $this->isExpansion();

        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_name, player_score, player_rerolls, player_small_board) VALUES ";
        $values = [];
        $i = 0;
        foreach($players as $playerId => $player) {

            // The player on the right of first player receives 2 reroll tokens.
            $lastPlayer = $i > 0 && $i == count($players) - 1;
            $smallBoard = $i >= 4 ? 1 : 0;

            $values[] = "('".$playerId."','000000','".addslashes( $player['player_name'] )."', 10, ".($lastPlayer ? 2 : 0).", $smallBoard)";

            if ($i == 0) {
                $this->setGameStateValue(FIRST_PLAYER, (int)$playerId);
            }

            $i++;
        }
        $sql .= implode(',', $values);
        $this->DbQuery( $sql );
        $this->reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/
        if ($this->getSide() === 0) {
            $this->bga->tableOptions->set(BOARD_SIDE, bga_rand(1, 2));
        }
        // make sure exansion options aren't activated if expansion is not activated
        if (!$isExpansion) {
            foreach ([1, 2, 3] as $moduleNumber) {
                $this->bga->tableOptions->set(OPTION_EXPANSION + $moduleNumber, 1);
            }
        }

        // Init global values with their initial values
        $this->setGameStateInitialValue(DAY, 0);
        $this->setGameStateInitialValue(SOLO_DECK, 1);
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.jsonc file)
        $this->bga->tableStats->init('days', 0);
        $this->bga->tableStats->init('collectedSmallDice', 0);
        $this->bga->playerStats->init('collectedSmallDice', 0);
        $this->bga->tableStats->init('rerolledDice', 0);
        $this->bga->playerStats->init('rerolledDice', 0);
        $this->bga->tableStats->init('changedDice', 0);
        $this->bga->playerStats->init('changedDice', 0);
        $this->bga->tableStats->init('scoreBack', 0);
        $this->bga->playerStats->init('scoreBack', 0);
        $this->bga->tableStats->init('resolvedCards', 0);
        $this->bga->playerStats->init('resolvedCards', 0);
        $this->bga->tableStats->init('discardedCompanions', 0);
        $this->bga->playerStats->init('discardedCompanions', 0);
        $this->bga->tableStats->init('moves', 0);
        $this->bga->playerStats->init('moves', 0);
        $this->bga->tableStats->init('footprintsAsJokers', 0);
        $this->bga->playerStats->init('footprintsAsJokers', 0);
        foreach($this->ADVENTURERS as $adventurer) {
            $this->bga->tableStats->init($adventurer->name, 0);
            $this->bga->playerStats->init($adventurer->name, 0);
        }
        $this->bga->playerStats->init('points', 0);

        $playerCount = count($players);
        $solo = $playerCount == 1;
        if ($solo) {
            $this->initTom();
        }
        
        $this->createDice($isExpansion, $playerCount);
        $meeplePlayersIds = array_keys($players);
        if ($solo) {
            $meeplePlayersIds[] = 0;
        }
        $this->createMeeples($meeplePlayersIds);
        $this->createAdventurers($isExpansion, $solo);
        $expansionCompanions = $this->getExpansionCompanions($playerCount);
        $this->createCompanions($solo, $expansionCompanions[0], $expansionCompanions[1]);
        if ($solo) {
            $this->createSoloTiles();
        } else {
            $this->createSpells($isExpansion);
        }
        if ($this->tokensActivated()) {
            $this->bga->playerStats->init('endTokenPoints', 0);
            $this->bga->playerStats->init('tokensCount', 0);
            $this->bga->tableStats->init('tokenBagEmptied', 0);
            
            $this->createTokens();
        }

        $this->setDiceOnTable($solo, $isExpansion);

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        return PrepareAdventurerChoice::class;
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas(): array {
        $isExpansion = $this->isExpansion();
        $tokensActivated = $this->tokensActivated();
        
        $result = [];
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo, player_rerolls rerolls, player_footprints footprints, player_fireflies fireflies, player_score_before_end scoreBeforeEnd, player_score_cards scoreCards, player_score_board scoreBoard, player_score_tokens scoreTokens, player_score_after_end scoreAfterEnd, player_small_board smallBoard FROM player ";
        $result['players'] = $this->getCollectionFromDb($sql);

        $solo = count($result['players']) == 1;
  
        $result['firstPlayer'] = intval($this->getGameStateValue(FIRST_PLAYER));
        $result['side'] = $this->getSide();
        $result['day'] = intval($this->getGameStateValue(DAY));
        
        $result['tableDice'] = $this->getDiceByLocation('table');
        $result['topDeckType'] = $this->getTopDeckType();
        $result['topCemeteryType'] = $this->getTopCemeteryType();
        $result['topDeckType'] = $this->getTopDeckType();
        $result['topDeckBType'] = $solo && intval($this->companions->countCardInLocation('deckB')) > 0 ? 2 : 0;
        $result['discardedSoloTiles'] = $solo ? intval($this->soloTiles->countCardInLocation('discard')) : 0;

        $dice = $this->getDiceByLocation('meeting');
        $meetingTrack = [];
        $tomDiceSetAside = array_values(array_filter($dice, fn($idie) => $idie->location_arg === 0));
        $meetingTrack[0] = new MeetingTrackSpot(null, $tomDiceSetAside);

        $spotCount = $this->getSpotCount();
        for ($i=1;$i<=$spotCount;$i++) {
            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $i));
            $companion = count($companions) > 0 ? $companions[0] : null;

            $spotDice = array_values(array_filter($dice, fn($idie) => $idie->location_arg === $i));

            $footprints = $this->getMeetingTrackFootprints($i);

            $meetingTrack[$i] = new MeetingTrackSpot($companion, $spotDice, $footprints);
        }

        $result['meetingTrack'] = $meetingTrack;

        foreach($result['players'] as $playerId => &$player) {
            $player['playerNo'] = intval($player['playerNo']);
            $player['meeples'] = $this->getPlayerMeeples($playerId);
            $adventurers = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $playerId));
            $player['adventurer'] = count($adventurers) > 0 ? $adventurers[0] : null;
            $player['companions'] = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId), null, 'location_arg');
            $player['spells'] = $this->getSpellsFromDb($this->spells->getCardsInLocation('player', $playerId));
            $player['dice'] = $this->getDiceByLocation('player', $playerId);
            $player['rerolls'] = intval($player['rerolls']);
            $player['footprints'] = intval($player['footprints']);
            $player['fireflies'] = intval($player['fireflies']);
            $player['smallBoard'] = boolval($player['smallBoard']);
            if ($tokensActivated) {
                $player['tokens'] = $this->getPlayerTokens($playerId);
            }
        }

        if ($solo) {
            $result['tom'] = $this->getTom();
            $result['tom']->meeples = $this->getPlayerMeeples(0);
            $result['tom']->tokens = $this->getPlayerTokens(0);
        }

        $result['ADVENTURERS'] = $this->ADVENTURERS;
        $result['COMPANIONS'] = $this->getAllCompanions();
        $result['SPELLS_EFFECTS'] = array_map(fn ($card) => $card->effect, $this->getAllSpells());
        $result['SOLO_TILES'] = $this->SOLO_TILES;

        $result['expansion'] = $isExpansion;
        $result['tokensActivated'] = $tokensActivated;
  
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see the state classes in modules/php/States)
    */
    function getGameProgression() {
        $stateName = $this->gamestate->getCurrentMainState()->name; 
        if ($stateName === 'gameEnd') {
            return 100;
        }

        return (int)((intval($this->getGameStateValue(DAY)) - 1) * 12.5);
    }

//////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb($from_version) {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//

        // TEMP
        if ($from_version <= 2112221034) {
            $sql = "UPDATE `DBPREFIX_companion` SET `card_location` = CONCAT(`card_location`, `card_location_arg`), `card_location_arg` = 0 WHERE `card_location` = 'player'";
            $this->applyDbUpgradeToAllDB($sql);
        }

        if ($from_version <= 2112291719) {
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` ADD `player_score_before_end` int(10) unsigned NOT NULL DEFAULT '0'");
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` ADD `player_score_cards` int(10) unsigned NOT NULL DEFAULT '0'");
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` ADD `player_score_board` int(10) unsigned NOT NULL DEFAULT '0'");
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` ADD `player_score_after_end` int(10) unsigned NOT NULL DEFAULT '0'");
        }

        if ($from_version <= 2201020009) {
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` MODIFY  `player_score_before_end` int(10) unsigned");
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` MODIFY  `player_score_cards` int(10) unsigned");
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` MODIFY  `player_score_board` int(10) unsigned");
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` MODIFY  `player_score_after_end` int(10) unsigned");
        }

        if ($from_version <= 2201111938) {
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` MODIFY  `player_score_before_end` int(10)");
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` MODIFY  `player_score_cards` int(10)");
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` MODIFY  `player_score_board` int(10)");
            $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` MODIFY  `player_score_after_end` int(10)");
        }
        
        if ($from_version <= 2409071101) {
            $result = self::getUniqueValueFromDB("SHOW COLUMNS FROM `player` LIKE 'player_score_tokens'");
            if (is_null($result)) {
                $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` ADD `player_score_tokens` int(10) NOT NULL DEFAULT '0'");
                $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` ADD `player_small_board` TINYINT UNSIGNED NOT NULL DEFAULT '0'");
                $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` ADD `player_selected_companion` int(10) NULL");
                $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player` ADD `player_selected_destination` json");
                $this->applyDbUpgradeToAllDB("ALTER TABLE `DBPREFIX_player`  ADD `player_disabled_symbols` json");
            }
        }
    }    
}