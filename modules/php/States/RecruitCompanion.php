<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Models\MeetingTrackSpot;
use Bga\Games\Glow\Game;

class RecruitCompanion extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 20,
            type: StateType::ACTIVE_PLAYER,
            name: 'recruitCompanion',
            description: clienttranslate('${actplayer} must recruit a companion'),
            descriptionMyTurn: clienttranslate('${you} must recruit a companion'),
            transitions: [
                'moveBlackDie' => 23,
                'selectSketalDie' => 22,
                'nextPlayer' => 28,
                'removeCompanion' => 21,
            ],
            updateGameProgression: true,
        );
    }

    public function getArgs(): array {
        $companions = [];
        $companions[0] = null;

        $solo = $this->game->isSoloMode();

        $dice = $this->game->getDiceByLocation('meeting');

        $spotCount = $this->game->getSpotCount();
        for ($i=1;$i<=$spotCount;$i++) {
            $companionsFromDb = $this->game->getCompanionsFromDb($this->game->companions->getCardsInLocation('meeting', $i));
            $companion = count($companionsFromDb) > 0 ? $companionsFromDb[0] : null;

            if ($companion && $companion->die) {
                $companion->noDieWarning = !$this->game->isBigDieAvailable($companion->dieColor);
            }

            $spotDice = array_values(array_filter($dice, fn($idie) => $idie->location_arg === $i));

            $footprints = $this->game->getMeetingTrackFootprints($i);

            $soloTile = null;
            if ($solo) {
                $soloTilesFromDb = $this->game->getSoloTilesFromDb($this->game->soloTiles->getCardsInLocation('meeting', $i));
                $soloTile = count($soloTilesFromDb) > 0 ? $soloTilesFromDb[0] : null;
            }

            $companions[$i] = new MeetingTrackSpot($companion, $spotDice, $footprints, $soloTile);
        }

        return [
           'companions' => $companions,
           'topDeckType' => $this->game->getTopDeckType(),
        ];
    }

    public function onEnteringState(): void {
        $uriomIntervention = $this->game->getGlobalVariable(URIOM_INTERVENTION);
        if ($uriomIntervention !== null && $uriomIntervention->activated === false) {
            $this->game->recruitCompanionAction($uriomIntervention->activePlayerId, $uriomIntervention->spot);
        } else if (intval($this->game->getUniqueValueFromDB("SELECT player_recruit_day FROM player where `player_id` = ".$this->game->getActivePlayerId())) == intval($this->game->getGameStateValue(DAY)))  {
            // if Uriom has already played with its intervention, we skip its turn
            $this->game->gamestate->nextState('nextPlayer');
        }
    }


    #[PossibleAction]
    public function actRecruitCompanion(#[IntParam(min: 0)] int $spot, int $activePlayerId): void {
        $this->game->recruitCompanionForPlayer($activePlayerId, $spot);
    }

    public function zombie(int $playerId, array $args): ?string {
        $choices = [];
        foreach ($args['companions'] as $spot => $meetingSpot) {
            if ($meetingSpot !== null && $meetingSpot->companion !== null) {
                $choices[] = (int)$spot;
            }
        }
        if ($choices === []) {
            return NextPlayerRecruitCompanion::class;
        }
        $this->actRecruitCompanion($this->getRandomZombieChoice($choices), $playerId);
        return null;
    }
}
