<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class EndRound extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 80,
            type: StateType::GAME,
            name: 'endRound',
        );
    }

    public function onEnteringState(): int|string {
        // reset dice use
        $this->game->DbQuery("UPDATE dice SET `used` = false");
        $this->game->DbQuery("UPDATE player SET `player_disabled_symbols` = '[]'");

        $this->game->placeCompanionsOnMeetingTrack();
        $this->game->addFootprintsOnMeetingTrack();

        if ($this->game->tokensActivated()) {
            $playersIds = $this->game->getPlayersIds();
            foreach($playersIds as $playerId) {
                $tokens = array_values(array_filter($this->game->getPlayerTokens($playerId), fn($token) => $token->type == 2));
                foreach ($tokens as $token) {
                    $this->game->removePlayerToken($playerId, $token->id);
                }
            }
            $this->game->tokens->moveAllCardsInLocation('front', 'bag');
            $this->game->tokens->shuffle('bag');
        }

        $solo = $this->game->isSoloMode();

        if (!$solo) {
            $nextPlayerTable = $this->game->createNextPlayerTable(array_keys($this->game->loadPlayersBasicInfos()));
            $newFirstPlayer = intval($nextPlayerTable[intval($this->game->getGameStateValue(FIRST_PLAYER))]);

            $this->game->gamestate->changeActivePlayer($newFirstPlayer);

            $this->game->setGameStateValue(FIRST_PLAYER, $newFirstPlayer);

            $this->game->bga->notify->all('newFirstPlayer', clienttranslate('${player_name} is the new First player'), [
                'playerId' => $newFirstPlayer,
                'player_name' => $this->game->getPlayerName($newFirstPlayer),
            ]);

        }


        $this->game->bga->tableStats->inc('days', 1);

        $day = intval($this->game->getGameStateValue(DAY));
        $this->game->bga->notify->all('endDay', clienttranslate('Day ${day} ends'), [
            'day' => $day,
        ]);

        $end = false;
        if ($solo) {
            $end = intval($this->game->getGameStateValue(SOLO_DECK)) > 2;
        } else {
            $end = $day >= 8;
        }

        if ($end) {
            return EndScore::class;
        } else {
            return StartRound::class;
        }
    }
}
