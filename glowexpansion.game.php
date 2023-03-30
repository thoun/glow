<?php
 /**
  *------
  * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
  * GlowExpansion implementation : © <Your name here> <Your email address here>
  * 
  * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
  * See http://en.boardgamearena.com/#!doc/Studio for more information.
  * -----
  * 
  * glowexpansion.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


require_once(APP_GAMEMODULE_PATH.'module/table/table.game.php');

require_once('modules/php/constants.inc.php');
require_once('modules/php/utils.php');
require_once('modules/php/states.php');
require_once('modules/php/args.php');
require_once('modules/php/actions.php');
require_once('modules/php/map.php');
require_once('modules/php/solo-util.php');
require_once('modules/php/solo-args.php');
require_once('modules/php/solo-actions.php');
require_once('modules/php/debug-util.php');

class GlowExpansion extends Table {
    use UtilTrait;
    use ActionTrait;
    use StateTrait;
    use ArgsTrait;
    use MapTrait;

    use SoloUtilTrait;
    use SoloArgsTrait;
    use SoloActionTrait;

    use DebugUtilTrait;

	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        $this->initGameStateLabels([
            DAY => 10,
            FIRST_PLAYER => 11,
            SOLO_DECK => 12,
            
            BOARD_SIDE => 100,
            RANDOM_ADVENTURERS => 101,
            OPTION_EXPANSION => OPTION_EXPANSION,
            OPTION_EXPANSION_MODULE1 => OPTION_EXPANSION_MODULE1,
            OPTION_EXPANSION_MODULE2 => OPTION_EXPANSION_MODULE2,
            OPTION_EXPANSION_MODULE3 => OPTION_EXPANSION_MODULE3,
        ]); 
		
        $this->adventurers = $this->getNew("module.common.deck");
        $this->adventurers->init("adventurer");
		
        $this->companions = $this->getNew("module.common.deck");
        $this->companions->init("companion");
		
        $this->spells = $this->getNew("module.common.deck");
        $this->spells->init("spells");
		
        $this->soloTiles = $this->getNew("module.common.deck");
        $this->soloTiles->init("solotiles");
	}
	
    protected function getGameName() {
		// Used for translations and stuff. Please do not modify.
        return "glowexpansion";
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
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_score, player_avatar, player_rerolls, player_small_board) VALUES ";
        $values = [];
        $i = 0;
        foreach($players as $playerId => $player) {

            // The player on the right of first player receives 2 reroll tokens.
            $lastPlayer = $i > 0 && $i == count($players) - 1;
            $smallBoard = $i >= 4 ? 1 : 0;

            $values[] = "('".$playerId."','000000','".$player['player_canal']."','".addslashes( $player['player_name'] )."', 10, '".addslashes( $player['player_avatar'] )."', ".($lastPlayer ? 2 : 0).", $smallBoard)";

            if ($i == 0) {
                $this->setGameStateValue(FIRST_PLAYER, $playerId);
            }

            $i++;
        }
        $sql .= implode(',', $values);
        $this->DbQuery( $sql );
        $this->reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        $this->setGameStateInitialValue('DAY', 0);
        $this->setGameStateInitialValue('SOLO_DECK', 1);
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        $this->initStat('table', 'days', 0);
        $this->initStat('table', 'collectedSmallDice', 0);
        $this->initStat('player', 'collectedSmallDice', 0);
        $this->initStat('table', 'rerolledDice', 0);
        $this->initStat('player', 'rerolledDice', 0);
        $this->initStat('table', 'changedDice', 0);
        $this->initStat('player', 'changedDice', 0);
        $this->initStat('table', 'scoreBack', 0);
        $this->initStat('player', 'scoreBack', 0);
        $this->initStat('table', 'resolvedCards', 0);
        $this->initStat('player', 'resolvedCards', 0);
        $this->initStat('table', 'discardedCompanions', 0);
        $this->initStat('player', 'discardedCompanions', 0);
        $this->initStat('table', 'moves', 0);
        $this->initStat('player', 'moves', 0);
        $this->initStat('table', 'footprintsAsJokers', 0);
        $this->initStat('player', 'footprintsAsJokers', 0);
        foreach($this->ADVENTURERS as $adventurer) {            
            $this->initStat('table', $adventurer->name, 0);
            $this->initStat('player', $adventurer->name, 0);
        }

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
            $this->createSpells();
        }

        // TODO TEMP card to test
        $this->debugSetup();

        $this->setDiceOnTable($solo);

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas() {
        $isExpansion = $this->isExpansion();
        
        $result = [];
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo, player_rerolls rerolls, player_footprints footprints, player_fireflies fireflies, player_score_before_end scoreBeforeEnd, player_score_cards scoreCards, player_score_board scoreBoard, player_score_after_end scoreAfterEnd, player_small_board smallBoard FROM player ";
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
        }

        if ($solo) {
            $result['tom'] = $this->getTom();
            $result['tom']->meeples = $this->getPlayerMeeples(0);
            $result['tom']->color = '000000';
        }

        $result['ADVENTURERS'] = $this->ADVENTURERS;
        $result['COMPANIONS'] = $this->getAllCompanions();
        $result['SPELLS_EFFECTS'] = array_map(fn ($card) => $card->effect, $this->SPELLS);
        $result['SOLO_TILES'] = $this->SOLO_TILES;

        $result['expansion'] = $isExpansion;
  
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression() {
        $stateName = $this->gamestate->state()['name']; 
        if ($stateName === 'gameEnd') {
            return 100;
        }

        return (intval($this->getGameStateValue(DAY)) - 1) * 12.5;
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn($state, $active_player) {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    $this->gamestate->nextState("zombiePass");
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            
            return;
        }

        throw new feException("Zombie mode not supported at this game state: ".$statename);
    }
    
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
    }    
}