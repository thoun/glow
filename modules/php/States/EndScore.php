<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class EndScore extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 90,
            type: StateType::GAME,
            name: 'endScore',
        );
    }

    public function onEnteringState(): int|string {
        $playersIds = $this->game->getPlayersIds();
        $solo = count($playersIds) == 1;

        if ($solo) {
            $playersIds[] = 0;

            if ($this->game->getSide() == 1) {
                $this->provinceOfShadowLastMove();
            }
        }

        foreach($playersIds as $playerId) {
            $score = 0;
            if ($playerId == 0) {
                $tom = $this->game->getTom();
                $tom->scoreBeforeEnd = $tom->score;
                $score = $tom->scoreBeforeEnd;
                $this->game->setTom($tom);
            } else {
                $this->game->DbQuery("UPDATE player SET player_score_before_end = player_score WHERE player_id = $playerId");
                $score = intval($this->game->getUniqueValueFromDB("SELECT player_score_before_end FROM player where player_id = $playerId"));
            }

            $this->game->bga->notify->all('scoreBeforeEnd', '', [
                'playerId' => $playerId,
                'points' => $score,
            ]);
        }

        // Adventurer and companions
        foreach($playersIds as $playerId) {
            if ($playerId != 0) {
                $points = 0;
                $adventurers = $this->game->getAdventurersFromDb($this->game->adventurers->getCardsInLocation('player', $playerId));
                if (count($adventurers) > 0) {
                    $points += $adventurers[0]->points;
                }
                $companions = $this->game->getCompanionsFromDb($this->game->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
                foreach($companions as $companion) {
                    $points += $companion->points;
                }

                $this->game->DbQuery("UPDATE player SET player_score_cards = $points WHERE player_id = $playerId");

                $this->game->bga->notify->all('scoreCards', '', [
                    'playerId' => $playerId,
                    'points' => $points,
                ]);

                $this->game->incPlayerScore($playerId, $points, clienttranslate('${player_name} gains ${points} bursts of light with adventurer and companions'));

                $this->game->bga->playerStats->set('cardsEndPoints', $points, $playerId);
            }
        }

        // Journey board
        $side = $this->game->getSide();
        foreach($playersIds as $playerId) {
            $points = $this->game->getMapFinalScore($side, $playerId);

            $message = null;
            if ($side === 1) {
                $message = clienttranslate('${player_name} gains ${points} bursts of light with the village where encampment is situated');
            } else if ($side === 2) {
                $message = clienttranslate('${player_name} gains ${points} bursts of light with boats placed on islands');
            }

            if ($playerId == 0) {
                $tom = $this->game->getTom();
                $tom->scoreBoard = $points;
                $this->game->setTom($tom);
            } else {
                $this->game->DbQuery("UPDATE player SET player_score_board = $points WHERE player_id = $playerId");
            }

            $this->game->bga->notify->all('scoreBoard', '', [
                'playerId' => $playerId,
                'points' => $points,
            ]);

            $this->game->incPlayerScore($playerId, $points, $message);

            if ($playerId != 0) {
                $this->game->bga->playerStats->set('meepleEndPoints', $points, $playerId);
            }
        }

        // Fireflies
        foreach($playersIds as $playerId) {
            if ($playerId != 0) {
                $points = $this->game->getPlayerFireflies($playerId);
                $companions = $this->game->getCompanionsFromDb($this->game->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
                $companionCount = count($companions);

                foreach($companions as $companion) {
                    $points += $companion->fireflies;
                }

                // If they have as many or more fireflies than companions, they score 10 bursts of light.
                if ($points >= $companionCount) {
                    $this->game->incPlayerScore($playerId, 10, clienttranslate('${player_name} gains ${points} bursts of light with fireflies (more fireflies than companions)'));
                }

                $this->game->bga->notify->all('scoreFireflies', '', [
                    'playerId' => $playerId,
                    'points' => $points >= $companionCount ? 10 : 0,
                ]);

                if ($playerId != 0) {
                    $this->game->bga->playerStats->set('endFirefliesTokens', $points, $playerId);
                    $this->game->bga->playerStats->set('endCompanionCount', $companionCount, $playerId);
                    $this->game->bga->playerStats->set('endFirefliesBonus', $points >= $companionCount ? 1 : 0, $playerId);
                }
            }
        }

        //Each player scores 1 burst of light per footprint in their possession.
        foreach($playersIds as $playerId) {
            $points = $this->game->getPlayerFootprints($playerId);

            $this->game->bga->notify->all('scoreFootprints', '', [
                'playerId' => $playerId,
                'points' => $points,
            ]);

            $this->game->incPlayerScore($playerId, $points, clienttranslate('${player_name} gains ${points} bursts of light with footprints'));

            if ($playerId != 0) {
                $this->game->bga->playerStats->set('endFootprintsCount', $points, $playerId);
            }
        }

        if ($this->game->tokensActivated()) {
            foreach($playersIds as $playerId) {
                $tokens = $this->game->getPlayerTokens($playerId, true);
                $points = 0;
                $tokensByColor = [];
                foreach($tokens as $token) {
                    if (!array_key_exists($token->typeArg, $tokensByColor)) {
                        $tokensByColor[$token->typeArg] = 1;
                    } else {
                        $tokensByColor[$token->typeArg]++;
                    }
                }

                for($color = 1; $color <= 6; $color++) {
                    $colorTokens = array_values(array_filter($tokens, fn($token) => $token->typeArg == $color));
                    if (count($colorTokens)) {
                        $points += $this->game->POINTS_FOR_COLOR_TOKENS[$tokensByColor[$color] ?? 0];
                    }
                }

                if (count($tokensByColor) >= 6) {
                    $points += 10; // only once * min($tokensByColor);
                }

                $this->game->DbQuery("UPDATE player SET player_score_tokens = $points WHERE player_id = $playerId");

                $this->game->bga->notify->all('scoreTokens', '', [
                    'playerId' => $playerId,
                    'points' => $points,
                ]);

                $this->game->incPlayerScore($playerId, $points, clienttranslate('${player_name} gains ${points} bursts of light with colored tokens'));

                if ($playerId != 0) {
                    $this->game->bga->playerStats->set('endTokenPoints', $points, $playerId);
                    $this->game->bga->playerStats->set('coloredTokensCount', count($tokens), $playerId);
                    $this->game->bga->playerStats->set('tokensCount', count($this->game->getPlayerTokens($playerId, false)), $playerId);
                }
            }
        }

        foreach($playersIds as $playerId) {
            $score = 0;
            if ($playerId == 0) {
                $tom = $this->game->getTom();
                $tom->scoreAfterEnd = $tom->score;
                $score = $tom->scoreAfterEnd;
                $this->game->setTom($tom);
            } else {
                $this->game->DbQuery("UPDATE player SET player_score_after_end = player_score WHERE player_id = $playerId");
                $score = intval($this->game->getUniqueValueFromDB("SELECT player_score_after_end FROM player where player_id = $playerId"));
                $this->game->bga->playerStats->set('points', $score, $playerId);
            }

            $this->game->bga->notify->all('scoreAfterEnd', '', [
                'playerId' => $playerId,
                'points' => $score,
            ]);


            $adventurers = $this->game->getAdventurersFromDb($this->game->adventurers->getCardsInLocation('player', $playerId));
            if (count($adventurers) > 0) {
                $adventurer = $adventurers[0];
                $this->game->bga->tableStats->set($adventurer->name.'Points', $score);
                $this->game->bga->playerStats->set($adventurer->name.'Points', $score, $playerId);
            }
        }

        if ($solo) { // solo mode
            $playerId = $playersIds[0];
            $playerScore = $this->game->bga->playerScore->get($playerId);
            $tom = $this->game->getTom();

            /*$this->game->bga->notify->all('soloEndScore', clienttranslate('${player_name} ends with ${points} bursts of light'), [
                'playerId' => $playerId,
                'player_name' => $this->game->getPlayerName($playerId),
                'points' => $playerScore,
            ]);
            $this->game->bga->notify->all('soloEndScore', clienttranslate('${player_name} ends with ${points} bursts of light'), [
                'playerId' => 0,
                'player_name' => $this->game->getPlayerName(0),
                'points' => $tom->score,
            ]);*/

            $score = (($playerScore > $tom->score) || ($playerScore == $tom->score && $this->game->getPlayerFootprints($playerId) > $tom->footprints)) ? 1 : 0;
            $this->game->bga->playerScore->set($playerId, $score, null);
            $this->game->bga->playerScoreAux->set($playerId, 0, null);
        } else {
            // Tie
            $rerollsByPlayer = $this->game->getCollectionFromDB("SELECT player_id, player_rerolls FROM player", true);
            foreach ($rerollsByPlayer as $id => $rerolls) {
                $this->game->bga->playerScoreAux->set((int)$id, (int)$rerolls, null);
            }
        }

        return 99;
    }

    private function provinceOfShadowLastMove(): void {
        $villages = array_filter($this->game->MAP1, fn($spot) => $spot->canSettle);
        uasort($villages, fn($spot1, $spot2) => $spot1->points - $spot2->points);

        $tomEncampment = $this->game->getPlayerEncampment(0);

        $getNextVillage = $tomEncampment->position == 0;
        $nextVillage = null;
        foreach ($villages as $position => $village) {
            if ($getNextVillage) {
                $nextVillage = $village;
                break;
            }
            if ($tomEncampment->position == $position) {
                $getNextVillage = true;
            }
        }

        if ($nextVillage !== null && $this->game->canPayFootprints(0, $nextVillage->effects)) {
            $this->game->movePlayerEncampment(0, $position);

            $footprintsCost = 0;
            foreach($nextVillage->effects as $cost) {
                if ($cost < -20 && $cost > -30) {
                    $footprintsCost += (-$cost) - 20;
                }
            }

            $this->game->removePlayerFootprints(0, (int)$footprintsCost);
        }
    }
}
