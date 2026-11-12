<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class MoveBlackDie extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 23,
            type: StateType::ACTIVE_PLAYER,
            name: 'moveBlackDie',
            description: clienttranslate('${actplayer} must move black die'),
            descriptionMyTurn: clienttranslate('${you} must move black die'),
            transitions: [
                'selectSketalDie' => 22,
                'nextPlayer' => 28,
                'removeCompanion' => 21,
            ],
        );
    }

    public function getArgs(): array {
        $sql = "select `card_location_arg` from `companion` where `card_location` = 'meeting'";
        $availableSpots = array_values(array_map(fn($dbLine) => intval($dbLine['card_location_arg']), $this->game->getCollectionFromDb($sql)));

        $die = $this->game->getSmallBlackDie();
        $dieSpot = $die->location_arg;

        $possibleSpots = array_values(array_filter($availableSpots, fn($spot) => $spot != $dieSpot));

        return [
            'possibleSpots' => $possibleSpots,
        ];
    }

    #[PossibleAction]
    public function actMoveBlackDie(#[IntParam(min: 0)] int $spot, int $currentPlayerId, int $activePlayerId): void {
        $spotCount = $this->game->getSpotCount();
        if ($spot < 1 || $spot > $spotCount) {
            throw new UserException("Not a valid spot");
        }

        $die = $this->game->getSmallBlackDie();
        $currentSpot = $die->location_arg;

        $die->setFace($spot);
        $this->game->persistDice([$die]);
        $this->game->moveDice([$die], 'meeting', $spot);

        $this->game->bga->notify->all('moveBlackDie', clienttranslate('${player_name} moves black die'), [
            'playerId' => (string)$currentPlayerId,
            'player_name' => $this->game->getPlayerName($currentPlayerId),
            'die' => $die,
        ]);

        $this->game->recruitCompanionForPlayer($activePlayerId, $currentSpot);
    }

    public function zombie(int $playerId, array $args): ?string {
        $choices = array_values($args['possibleSpots']);
        if ($choices === []) {
            return NextPlayerRecruitCompanion::class;
        }
        $this->actMoveBlackDie((int)$this->getRandomZombieChoice($choices), $playerId, $playerId);
        return null;
    }
}
