<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class SelectSketalDieMulti extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 36,
            type: StateType::PRIVATE,
            name: 'selectSketalDieMulti',
            description: clienttranslate('${actplayer} must choose a new die'),
            descriptionMyTurn: clienttranslate('${you} must choose a new die'),
        );
    }

    public function getArgs(): array {
        return $this->game->argSelectSketalDie();
    }

    #[PossibleAction]
    public function actSelectSketalDie(#[IntParam(min: 0)] int $id, int $currentPlayerId): void {
        $this->game->actSelectSketalDie($id, $currentPlayerId);
    }

    public function zombie(int $playerId, array $args): void {
        $choices = array_values($args['dice']);
        if ($choices === []) {
            // The remaining dice may have been taken by another active player.
            $this->game->gamestate->setPlayerNonMultiactive($playerId, 'next');
            return;
        }
        $die = $this->getRandomZombieChoice($choices);
        $this->actSelectSketalDie((int)$die->id, $playerId);
    }
}
