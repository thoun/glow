<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class MultiResolveCards extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 41,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            name: 'multiResolveCards',
            description: clienttranslate('Players must resolve their cards'),
            descriptionMyTurn: clienttranslate('${you} must resolve your cards (select the card to resolve first)'),
            transitions: [
                'move' => 51,
            ],
            initialPrivate: PrivateResolveCards::class,
        );
    }

    public function onEnteringState(): void {

        $playerWithEffects = [];

        $playersIds = $this->game->getPlayersIds();

        foreach($playersIds as $playerId) {
            $dice = $this->game->getDiceByLocation('player', $playerId);

            foreach($dice as &$idie) {
                if ($idie->color > 5 && $idie->face == 6 && $idie->location == 'player') { // we apply yellow/purple/black die special effect
                    $this->game->applyEffect($idie->location_arg, $idie->value, 3, null);
                }
            }

            $args = (object)$this->game->argResolveCardsForPlayer($playerId);
            if (count($args->remainingEffects) > 0 || $args->killTokenId > 0 || $args->disableTokenId > 0) {
                $playerWithEffects[] = $playerId;
            }
        }

        if (count($playerWithEffects) > 0) {
            $this->game->gamestate->setPlayersMultiactive($playerWithEffects, 'move', true);
            $this->game->gamestate->initializePrivateStateForAllActivePlayers();
        } else {
            $this->game->gamestate->nextState('move');
        }
    }

    public function zombie(int $playerId): void {

    }
}
