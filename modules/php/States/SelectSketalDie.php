<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class SelectSketalDie extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 22,
            type: StateType::ACTIVE_PLAYER,
            name: 'selectSketalDie',
            description: clienttranslate('${actplayer} must choose a new die'),
            descriptionMyTurn: clienttranslate('${you} must choose a new die'),
            transitions: [
                'nextPlayer' => 28,
                'removeCompanion' => 21,
            ],
        );
    }

    public function getArgs(): array {
        return $this->game->argSelectSketalDie();
    }

    #[PossibleAction]
    public function actSelectSketalDie(#[IntParam(min: 0)] int $id, int $currentPlayerId): void {
        $this->game->actSelectSketalDie($id, $currentPlayerId);
    }

    public function zombie(int $playerId, array $args): ?string {
        $choices = array_values($args['dice']);
        if ($choices === []) {
            return NextPlayerRecruitCompanion::class;
        }
        $die = $this->getRandomZombieChoice($choices);
        $this->actSelectSketalDie((int)$die->id, $playerId);
        return null;
    }
}
