<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class ResurrectMulti extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 35,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            name: 'resurrectMulti',
            description: clienttranslate('Players with Cromaug can take a companion from the cemetery'),
            descriptionMyTurn: clienttranslate('${you} can take a companion from the cemetery'),
            transitions: [
                'next' => 41,
            ],
            initialPrivate: Resurrect::class,
        );
    }

    public function getArgs(): array {
        return (new Resurrect($this->game))->getArgs();
    }

    public function onEnteringState(): void {
        $playerWithCromaugActivated = [];

        $playersIds = $this->game->getPlayersIds();

        foreach($playersIds as $playerId) {
            $dice = $this->game->getEffectiveDice($playerId);
            $companions = $this->game->getCompanionsFromDb($this->game->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));

            $cromaugCard = null;

            foreach($companions as $companion) {
                if ($companion->subType == 41) { // Cromaug
                    if ($this->game->isTriggeredEffectsForCard($playerId, $dice, $companion->effect)) {
                        $cromaugCard = $companion;
                        break;
                    }
                }
            }

            if ($cromaugCard !== null) {
                $playerWithCromaugActivated[] = $playerId;

                $this->game->sendToCemetery($playerId, $cromaugCard->id);
                $companion = $this->game->getCompanionFromDb($this->game->companions->getCard($cromaugCard->id));
                $this->game->bga->notify->all('removeCompanion', clienttranslate('${player_name} discards Cromaug and takes a companion from the cemetery'), [
                    'playerId' => $playerId,
                    'player_name' => $this->game->getPlayerName($playerId),
                    'companion' => $cromaugCard,
                ]);
            }
        }

        if (count($playerWithCromaugActivated) > 0) {
            $this->game->gamestate->setPlayersMultiactive($playerWithCromaugActivated, 'next', true);
            $this->game->gamestate->initializePrivateStateForAllActivePlayers();
        } else {
            $this->game->gamestate->nextState('next');
        }
    }

    public function zombie(int $playerId): void {

    }
}
