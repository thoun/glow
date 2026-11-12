<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Traits;

use Bga\GameFramework\Actions\CheckAction;
use Bga\GameFramework\Actions\Types\IntParam;

use Bga\Games\Glow\Models\Adventurer;
use Bga\Games\Glow\Models\Companion;
use Bga\Games\Glow\Models\Dice;
use Bga\Games\Glow\Models\UriomIntervention;

use Bga\GameFramework\UserException;

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (the framework dispatches the public act methods below)
    */

    public function applyChooseAdventurer(int $playerId, int $id, bool $soloMode) {
        $adventurer = $this->getAdventurerFromDb($this->adventurers->getCard($id));

        if ($adventurer->location != 'deck') {
            throw new UserException("Adventurer not available");
        }

        $this->adventurers->moveCard($adventurer->id, 'player', $playerId);

        // take big dice
        $dice = $this->getBigDiceByColor($adventurer->color, $adventurer->dice);
        if ($adventurer->color == 8) {
            $dice = array_merge(
                $this->getBigDiceByColor(8, 1),
                $this->getBigDiceByColor(80, 2),
            );
        } else if ($adventurer->color == 11) {
            $dice = array_merge(
                $this->getBigDiceByColor(7, $adventurer->dice),
            );
        }
        $this->moveDice($dice, 'player', $playerId);

        if ($adventurer->color == 11) {
            // we create and place the 2 special yellow small dice
            $sql = "INSERT INTO dice (`color`, `small`, `die_face`, `location`) VALUES ";
            $values = [];
            $deck = $this->getPlayerSmallBoard($playerId) ? 'decksmall' : 'deck';
            foreach ([1, 2] as $i) {
                $values[] = "(11, true, ".bga_rand(1, 5).", '$deck')";
            }
    
            $sql .= implode(',', $values);
            $this->DbQuery($sql);
        }

        $newPlayerColor = $this->ADVENTURERS_COLORS[$adventurer->color];
        $this->DbQuery("UPDATE player SET `player_color` = '$newPlayerColor' WHERE player_id = $playerId");
        $this->reloadPlayersBasicInfos();

        $this->bga->notify->all('chosenAdventurer', clienttranslate('${player_name} chooses adventurer ${adventurerName}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'adventurer' => $adventurer,
            'adventurerName' => $adventurer->name,
            'dice' => $dice,
            'newPlayerColor' => $newPlayerColor,
        ]);

        $this->bga->tableStats->set($adventurer->name, 1);
        $this->bga->playerStats->set($adventurer->name, 1, $playerId);

        if ($soloMode) {
            $movedDiceColorsToTable = [];

            if ($adventurer->color != 6) {
                $movedDiceColorsToTable[] = 6;
            }
            if ($adventurer->color != 7) {
                $movedDiceColorsToTable[] = 7;
            }

            $movedDiceToTable = array_map(fn($color) => $this->getBigDiceByColor($color, 1)[0], $movedDiceColorsToTable);

            $this->moveDice($movedDiceToTable, 'table');
            $this->bga->notify->all('setTableDice', '', [
                'dice' => $movedDiceToTable,
            ]);
        }
    }
    
    public function applyRecruitCompanion(int $playerId, object $companion, $spot = null) {
        $fromCemetery = $companion->location == 'cemetery' ? 5 : 0;
        $companion->location = 'player'.$playerId;
        $companion->location_arg = intval($this->getGameStateValue(DAY)) * 10 + $fromCemetery;
        $this->companions->moveCard($companion->id, $companion->location, $companion->location_arg);
        $this->DbQuery("UPDATE player SET `player_recruit_day` = (".$this->getDaySql().") where `player_id` = $playerId");  

        $dice = null;
        if ($spot !== null) {
            $dice = $this->getDiceByLocation('meeting', $spot);
            if ($playerId != $this->getPlayerWithUriom()) {
                $dice = array_values(array_filter($dice, fn($die) => $die->color != 11 || !$die->small));
            }
            $count = count($dice);
            if ($count > 0) {
                $this->moveDice($dice, 'player', $playerId);

                $this->bga->tableStats->inc('collectedSmallDice', $count);
                $this->bga->playerStats->inc('collectedSmallDice', $count, $playerId);
            }
        }

        $this->bga->notify->all('chosenCompanion', clienttranslate('${player_name} chooses companion ${companionName}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'companion' => $companion,
            'companionName' => $companion->name,
            'spot' => $spot,
            'dice' => $dice,
            // new cemetaryTop if chosen from cemetary
            'cemetaryTop' => $spot == null ? $this->getTopCemeteryCompanion() : null,
        ]);
        
        if ($spot !== null) {
            $this->addPlayerFootprints($playerId, $this->getMeetingTrackFootprints($spot));
            $this->removeMeetingTrackFootprints($spot);
        }

        // take new die if Sketal
        if ($companion->die && $companion->dieColor > 0) {
            $dice = $this->getAvailableBigDice();
            foreach($dice as $die) {
                if ($die->color === $companion->dieColor) {

                    $multi = $this->gamestate->getCurrentMainState()->name == 'resurrect';
                    if ($multi) {
                        $this->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
                        $die->used = true;
                    }

                    $this->takeSketalDie($playerId, $die);
                    break;
                }
            }
        } else if ($companion->subType == KAAR) {
            $die = $this->getSmallBlackDie();

            // small black die enters the game
            if ($die->location == 'table') {
                
                $availableSpots = [];
                $spotCount = $this->getSpotCount();
                for ($i=1;$i<=$spotCount;$i++) {
                    $availableSpots[] = $i;
                }

                if ($spot !== null) {
                    $availableSpots = array_values(array_map(fn($dbLine) => 
                        intval($dbLine['card_location_arg'])
                    , $this->getCollectionFromDb("select `card_location_arg` from `companion` where `card_location` = 'meeting'")));
                }

                $dieSpot = $availableSpots[bga_rand(0, count($availableSpots) - 1)];
                
                $die->setFace($dieSpot);
                $this->persistDice([$die]);
                $this->moveDice([$die], 'meeting', $dieSpot);

                $this->bga->notify->all('moveBlackDie', clienttranslate('${player_name} adds black die with ${companionName}'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'companionName' => $companion->name,
                    'die' => $die,
                ]);
            }

            $adventurers = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $playerId));
            $adventurer = count($adventurers) > 0 ? $adventurers[0] : null;
            // remove big black die if Kaar is played
            if ($adventurer->color == 8) {
                $dbDices = $this->getCollectionFromDB("SELECT * FROM dice WHERE `location` = 'player' AND `color` = 8 AND `small` = false");
                $bigBlackDice = array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
                if (count($bigBlackDice) > 0) {
                    $bigBlackDie = $bigBlackDice[0];
                    $this->moveDice([$bigBlackDie], 'zaydrel');

                    $this->bga->notify->all('removeSketalDie', clienttranslate('${player_name} loses the big black die'), [
                        'playerId' => $playerId,
                        'player_name' => $this->getPlayerName($playerId),
                        'die' => $bigBlackDie,
                        'remove' => true,
                    ]);
                }
            }
        }
    }

    function redirectAfterRecruit() {
        if ($this->getPlayerCount() == 2 && intval($this->getActivePlayerId()) == intval($this->getGameStateValue(FIRST_PLAYER))) {
            $this->gamestate->nextState('removeCompanion');
        } else {
            $this->gamestate->nextState('nextPlayer');
        }
        
    }
    
    public function recruitCompanionForPlayer(int $activePlayerId, int $spot) {

        $spotCount = $this->getSpotCount();
        if ($spot < 1 || $spot > $spotCount) {
            throw new UserException("Not a valid spot");
        }

        $spotDice = $this->getDiceByLocation('meeting', $spot);
        if (\array_any($spotDice, fn($die) => $die->color == 11 && $die->small) && !$this->uriomHasRecruited($activePlayerId)) {
            $this->setGlobalVariable(URIOM_INTERVENTION, new UriomIntervention($activePlayerId, $this->getPlayerWithUriom(), $spot));
            $this->gamestate->nextState('nextPlayer');
            return;
        }

        $this->recruitCompanionAction($activePlayerId, $spot);
    }

    public function recruitCompanionAction(int $playerId, int $spot) {
        $solo = $this->isSoloMode();
        if ($solo) {
            $soloTile = $this->getSoloTilesFromDb($this->soloTiles->getCardsInLocation('meeting', $spot))[0];
            $this->applyTomEffects($soloTile);
            $this->updateSoloDeck($spot);
        }

        $spotDice = $this->getDiceByLocation('meeting', $spot);

        if (\array_any($spotDice, fn($die) => $die->color == 8 && $die->small)) {
            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
            if (\array_any($companions, fn($companion) => $companion->subType == KAAR)) {
                $this->gamestate->nextState('moveBlackDie');
                return;
            }
        }
        
        $companion = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $spot))[0];

        if ($companion->location != 'meeting') {
            throw new UserException("Companion not available");
        }

        $this->applyRecruitCompanion($playerId, $companion, $spot);

        if ($solo) {
            $this->soloEndRecruit();
        }

        if ($companion->die && $companion->dieColor === 0 && $this->canChooseSketalDie()) {
            $this->gamestate->nextState('selectSketalDie');
        } else {
            $this->redirectAfterRecruit();
        }
    }

    public function actSelectSketalDie(#[IntParam(min: 0)] int $id, int $currentPlayerId) {
        $multi = $this->gamestate->getCurrentMainState()->name != 'selectSketalDie';

        $die = $this->getDieById($id);

        if ($die->location != 'table') {
            throw new UserException("Die not available");
        }

        if ($multi) {
            $this->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
            $die->used = true;
        }
        
        $this->takeSketalDie($currentPlayerId, $die);

        if ($multi) {
            $this->gamestate->setPlayerNonMultiactive($currentPlayerId, 'next');
        } else {
            $this->redirectAfterRecruit();
        }
    }

    function checkResolveCardEnd(int $playerId) {
        $args = (object)$this->argResolveCardsForPlayer($playerId);
        if (count($args->remainingEffects) > 0 || $args->killTokenId > 0 || $args->disableTokenId > 0) {
            $this->gamestate->nextPrivateState($playerId, \Bga\Games\Glow\States\PrivateResolveCards::class);
        } else {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'move');
            $this->giveExtraTime($playerId);
        }
    }

    #[CheckAction(false)]
    public function actActivateToken(#[IntParam(name: 'id', min: 0)] int $tokenId, int $currentPlayerId) {
        $token = $this->getTokenFromDb($this->tokens->getCard($tokenId));
        
        $currentState = $this->gamestate->getCurrentMainStateId();
        if (!in_array($currentState, [ST_MULTIPLAYER_PRIVATE_RESOLVE_CARDS, ST_MULTIPLAYER_PRIVATE_MOVE])) {
            throw new UserException("You can use this token only during the resolve card phase or the move phase.");
        }

        if ($token->type == 3 && $token->typeArg == 37) {
            $this->gamestate->setPrivateState($currentPlayerId, \Bga\Games\Glow\States\PrivateKillToken::class);
            // TODO check if need to activate player in case of inactive player
        }

        if ($token->type == 3 && $token->typeArg == 0) {
            $this->gamestate->setPrivateState($currentPlayerId, \Bga\Games\Glow\States\PrivateDisableToken::class);
            // TODO check if need to activate player in case of inactive player
        }
    }

    public function checkActivateTokenEnd(int $playerId) {

        $currentState = $this->gamestate->getCurrentMainStateId();
        if ($currentState == ST_MULTIPLAYER_CHANGE_DICE) {
            $this->gamestate->nextPrivateState($playerId, \Bga\Games\Glow\States\PrivateSelectDiceAction::class);
        } else if ($currentState == ST_MULTIPLAYER_PRIVATE_RESOLVE_CARDS) {
            $this->checkResolveCardEnd($playerId);
        } else if ($currentState == ST_MULTIPLAYER_PRIVATE_MOVE) {
            $this->checkMoveEnd($playerId, false);
        }
    }

    public function applyMove(int $playerId, object $route) {
        // apply route & destination effects
        foreach($route->costForPlayer as $effect) {
            $this->applyEffect($playerId, $effect, 4, null);

            if ($effect >= 1 && $effect <= 5) {
                $dice = $this->getDiceByLocation('player', $playerId, false);
                $die = \array_find($dice, fn($die) => $die->value == $effect);
                if ($die != null) {
                    $this->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");

                    $this->bga->notify->all('usedDice', '', [
                        'playerId' => $playerId,
                        'dieId' => $die->id,
                    ]);
                }
            }
        }

        $side = $this->getSide();

        $footprintEffect = \array_find($route->costForPlayer, fn($effect) => $effect < -20 && $effect > -30);
        if ($footprintEffect != null) {
            $destination = $this->getMapSpot($side, $route->destination);
            if (!\array_any($destination->effects, fn($effect) => $effect < -20 && $effect > -30)) {
                // we count footprints as joker only if we are not in a spot that require footprint cost
                $footprintCost = -($footprintEffect + 20);
                $this->bga->tableStats->inc('footprintsAsJokers', $footprintCost);
                $this->bga->playerStats->inc('footprintsAsJokers', $footprintCost, $playerId);
            }
        }

        if ($side === 1) {
            $this->movePlayerCompany($playerId, $route->destination, $route->from);
        } else if ($side === 2) {
            $this->movePlayerBoat($playerId, $route->destination, $route->from);
        }

        $this->bga->tableStats->inc('moves', 1);
        $this->bga->playerStats->inc('moves', 1, $playerId);

        $this->checkMoveEnd($playerId, true);
    }

    function checkMoveEnd(int $playerId, bool $fromMove) {    
        $args = (object)$this->argMoveForPlayer($playerId);
        $side = $this->getSide();
        if ($side != 2 && (count($args->possibleRoutes) > 0 || $args->canSettle || $args->killTokenId > 0 || $args->disableTokenId > 0)) {
            $this->gamestate->nextPrivateState($playerId, \Bga\Games\Glow\States\PrivateMove::class);
        } else if (!$fromMove) {
            $this->gamestate->nextPrivateState($playerId, \Bga\Games\Glow\States\PrivateMove::class);
        } else {
            $this->applyEndTurn($playerId);
        }
    }

    public function canDiscardCompanionSpell(int $playerId) {
        return count($this->companions->getCardsInLocation('player'.$playerId)) > 0 || count($this->spells->getCardsInLocation('player', $playerId)) > 0;
    }

    public function applyDiscardCompanionSpell(int $playerId, int $type, int $id) {

        if ($type == 1) {
            $companion = $this->getCompanionFromDb($this->companions->getCard($id));

            if ($companion->location != 'player'.$playerId) {
                throw new UserException("Player doesn't have selected companion");
            }

            $this->sendToCemetery($playerId, $companion->id);

            $this->bga->notify->all('removeCompanion', clienttranslate('${player_name} removes companion ${companionName}'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'companion' => $companion,
                'companionName' => $companion->name,
            ]);
        } else if ($type == 2) {
            $spell = $this->getSpellFromDb($this->spells->getCard($id));

            if ($spell->location != 'player' || $spell->location_arg != $playerId) {
                throw new UserException("Player doesn't have selected spell");
            }

            $this->discardSpell($playerId, $spell);
        }
    }

    public function applyEndTurn(int $playerId) {
        $this->replaceSmallDiceOnMeetingTrack($playerId);

        $this->gamestate->setPlayerNonMultiactive($playerId, \Bga\Games\Glow\States\EndRound::class);
        $this->giveExtraTime($playerId);
    }
  	
}
