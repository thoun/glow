class PlayerTable {
    public playerId: number;
    public machineStock: Stock;
    public projectStock: Stock;

    public onPlayerProjectSelectionChanged: (selectedProjectsIds: number[]) => any;

    constructor(
        private game: GlowGame, 
        player: GlowPlayer,
        side: 'left' | 'right') {

        this.playerId = Number(player.id);

        const color = player.color.startsWith('00') ? 'blue' : 'red';

        let html = `
        <div id="player-table-${this.playerId}" class="player-table whiteblock ${side}" style="background-color: #${player.color}40;">
            <div class="name-column ${color} ${side}">
                <div class="player-name">${player.name}</div>
                <div id="player-icon-${this.playerId}" class="player-icon ${color}"></div>

                <div class="player-resources ${side}">
                    <div id="player${this.playerId}-resources1"></div>
                    <div id="player${this.playerId}-resources2"></div>
                    <div id="player${this.playerId}-resources3"></div>
                    <div id="player${this.playerId}-resources0" class="top"></div>
                </div>
            </div>
            <div class="machines-and-projects">
                <div id="player-table-${this.playerId}-projects"></div>
                <div id="player-table-${this.playerId}-machines"></div>
            </div>
        </div>`;

        dojo.place(html, 'playerstables');

        // projects        

        this.projectStock = new ebg.stock() as Stock;
        this.projectStock.setSelectionAppearance('class');
        this.projectStock.selectionClass = 'selected';
        this.projectStock.create(this.game, $(`player-table-${this.playerId}-projects`), PROJECT_WIDTH, PROJECT_HEIGHT);
        this.projectStock.setSelectionMode(0);
        //this.projectStock.centerItems = true;
        this.projectStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupProjectCard(game, cardDiv, type);
        dojo.connect(this.projectStock, 'onChangeSelection', this, () => {
            
            this.projectStock.getSelectedItems()
                .filter(item => document.getElementById(`player-table-${this.playerId}-projects_item_${item.id}`).classList.contains('disabled'))
                .forEach(item => this.projectStock.unselectItem(item.id));                

            this.onProjectSelectionChanged()
        });
        setupProjectCards([this.projectStock]);

        player.projects.forEach(project => this.projectStock.addToStockWithId(getUniqueId(project), ''+project.id));
        this.setProjectStockVisibility();

        // machines

        this.machineStock = new ebg.stock() as Stock;
        this.machineStock.setSelectionAppearance('class');
        this.machineStock.selectionClass = 'selected';
        this.machineStock.create(this.game, $(`player-table-${this.playerId}-machines`), MACHINE_WIDTH, MACHINE_HEIGHT);
        this.machineStock.setSelectionMode(0);
        this.machineStock.centerItems = true;
        this.machineStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupMachineCard(game, cardDiv, type);
        setupMachineCards([this.machineStock]);

        player.machines.forEach(machine => this.machineStock.addToStockWithId(getUniqueId(machine), ''+machine.id));

        // resources
        for (let i=0; i<=3; i++) {
            const resourcesToPlace = player.resources[i];
            this.addResources(i, resourcesToPlace);
        }
    }

    private onProjectSelectionChanged() {
        this.onPlayerProjectSelectionChanged?.(this.projectStock.getSelectedItems().map(item => Number(item.id)));
    }

    private getDistance(p1: Partial<PlacedTokens>, p2: Partial<PlacedTokens>): number {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    private getPlaceOnPlayerBoard(placed: PlacedTokens[], type: number): Partial<PlacedTokens> {
        const xMaxShift = type ? 28 : 148;
        const yMaxShift = type ? 84 : 32;
        const newPlace = {
            x: Math.random() * xMaxShift,
            y: Math.random() * yMaxShift,
        };
        let protection = 0;
        while (protection < 1000 && placed.some(place => this.getDistance(newPlace, place) < 32)) {
            newPlace.x = Math.random() * xMaxShift;
            newPlace.y = Math.random() * yMaxShift;
            protection++;
        }

        return newPlace;
    }

    public addResources(type: number, resources: Resource[]) {
        const divId = `player${this.playerId}-resources${type}`;
        const div = document.getElementById(divId);
        if (!div) {
            return;
        }
        const placed: PlacedTokens[] = div.dataset.placed ? JSON.parse(div.dataset.placed) : [];

        // add tokens
        resources.filter(resource => !placed.some(place => place.resourceId == resource.id)).forEach(resource => {
            const newPlace = this.getPlaceOnPlayerBoard(placed, type);
            placed.push({
                ...newPlace, 
                resourceId: resource.id,
            } as PlacedTokens);

            const resourceDivId = `resource${type}-${resource.id}`;
            const resourceDiv = document.getElementById(`resource${type}-${resource.id}`);
            if (resourceDiv) {
                const originDiv = resourceDiv.parentElement;
                const originPlaced: PlacedTokens[] = originDiv.dataset.placed ? JSON.parse(originDiv.dataset.placed) : [];
                originDiv.dataset.placed = JSON.stringify(originPlaced.filter(place => place.resourceId != resource.id));

                if (originDiv.classList.contains('to_be_destroyed')) {
                    div.appendChild(resourceDiv);
                } else {
                    slideToObjectAndAttach(resourceDiv, divId, newPlace.x , newPlace.y);
                }
            } else {
                let html = `<div id="${resourceDivId}"
                    class="cube resource${type} aspect${resource.id % (type == 0 ? 8 : 4)}" 
                    style="left: ${newPlace.x}px; top: ${newPlace.y}px;"
                ></div>`;
                dojo.place(html, divId);
            }
        });

        div.dataset.placed = JSON.stringify(placed);
    }

    public addWorkshopProjects(projects: Project[]) {
        projects.forEach(project => addToStockWithId(this.projectStock, getUniqueId(project), ''+project.id, 'page-title'));
        this.setProjectStockVisibility();
    }
    
    private setProjectStockVisibility() {
        dojo.toggleClass(`player-table-${this.playerId}-projects`, 'empty', !this.projectStock.items.length);
    }
    public setProjectSelectable(selectable: boolean) {
        this.projectStock.setSelectionMode(selectable ? 2 : 0);
        if (!selectable) {
            this.projectStock.unselectAll();
        }
    }
}