<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Models\MeetingTrackSpot;
use Bga\Games\Glow\Game;

class RemoveCompanion extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 21,
            type: StateType::ACTIVE_PLAYER,
            name: 'removeCompanion',
            description: clienttranslate('${actplayer} must remove a companion'),
            descriptionMyTurn: clienttranslate('${you} must remove a companion'),
            transitions: [
                'nextPlayer' => 28,
            ],
        );
    }

    public function getArgs(): array {
        $companions = [];
        $companions[0] = null;

        $spotCount = $this->game->getSpotCount();
        for ($i=1;$i<=$spotCount;$i++) {
            $companionsFromDb = $this->game->getCompanionsFromDb($this->game->companions->getCardsInLocation('meeting', $i));
            $companion = count($companionsFromDb) > 0 ? $companionsFromDb[0] : null;
            $companions[$i] = new MeetingTrackSpot($companion);
        }

        return [
           'companions' => $companions,
        ];
    }

    #[PossibleAction]
    public function actRemoveCompanion(#[IntParam(min: 0)] int $spot, int $currentPlayerId): void {
        $spotCount = $this->game->getSpotCount();
        if ($spot < 1 || $spot > $spotCount) {
            throw new UserException("Not a valid spot");
        }

        if ($this->game->spotHasUriomDice($spot) && $currentPlayerId != $this->game->getPlayerWithUriom()) {
            throw new UserException("You can't remove a card with a small yellow die"); // TODO check translation / make translatable
        }

        $companions = $this->game->getCompanionsFromDb($this->game->companions->getCardsInLocation('meeting', $spot));

        if (count($companions) == 0) {
            return;
        }

        $companion = $companions[0];

        if ($companion->location != 'meeting') {
            throw new UserException("Companion not available");
        }

        $this->game->sendToCemetery($currentPlayerId, $companion->id);

        $this->game->bga->notify->all('removeCompanion', clienttranslate('${player_name} removes companion ${companionName}'), [
            'playerId' => $currentPlayerId,
            'player_name' => $this->game->getPlayerName($currentPlayerId),
            'companion' => $companion,
            'companionName' => $companion->name,
            'spot' => $spot,
        ]);

        $this->game->gamestate->nextState('nextPlayer');
    }

    public function zombie(int $playerId, array $args): ?string {
        $choices = [];
        foreach ($args['companions'] as $spot => $meetingSpot) {
            if ($meetingSpot !== null && $meetingSpot->companion !== null
                && (!$this->game->spotHasUriomDice((int)$spot) || $playerId === $this->game->getPlayerWithUriom())) {
                $choices[] = (int)$spot;
            }
        }
        if ($choices === []) {
            return NextPlayerRecruitCompanion::class;
        }
        $this->actRemoveCompanion($this->getRandomZombieChoice($choices), $playerId);
        return null;
    }
}
