function slideToObjectAndAttach(object, destinationId, posX, posY) {
    var destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return Promise.resolve(true);
    }
    return new Promise(function (resolve) {
        var originalZIndex = Number(object.style.zIndex);
        object.style.zIndex = '10';
        var objectCR = object.getBoundingClientRect();
        var destinationCR = destination.getBoundingClientRect();
        var deltaX = destinationCR.left - objectCR.left + (posX !== null && posX !== void 0 ? posX : 0);
        var deltaY = destinationCR.top - objectCR.top + (posY !== null && posY !== void 0 ? posY : 0);
        //object.id == 'tile98' && console.log(object, destination, objectCR, destinationCR, destinationCR.left - objectCR.left, );
        object.style.transition = "transform 0.5s ease-in";
        object.style.transform = "translate(" + deltaX + "px, " + deltaY + "px)";
        var transitionend = function () {
            object.style.top = posY !== undefined ? posY + "px" : 'unset';
            object.style.left = posX !== undefined ? posX + "px" : 'unset';
            object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
            object.style.zIndex = originalZIndex ? '' + originalZIndex : 'unset';
            object.style.transform = 'unset';
            object.style.transition = 'unset';
            destination.appendChild(object);
            object.removeEventListener('transitionend', transitionend);
            resolve(true);
        };
        object.addEventListener('transitionend', transitionend);
    });
}
/*declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;*/
var MACHINES_IDS = [
    // blue
    11,
    12,
    13,
    14,
    15,
    // purple
    21,
    22,
    23,
    24,
    25,
    // red
    31,
    32,
    33,
    34,
    // yellow
    41,
    42,
];
var PROJECTS_IDS = [
    // colors
    10,
    11,
    12,
    13,
    14,
    // points
    20,
    21,
    22,
    23,
    // resources
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
];
var MACHINE_WIDTH = 190;
var MACHINE_HEIGHT = 190;
var PROJECT_WIDTH = 134;
var PROJECT_HEIGHT = 93;
function getUniqueId(object) {
    return object.type * 10 + object.subType;
}
function setupMachineCards(machineStocks) {
    var cardsurl = g_gamethemeurl + "img/cards.jpg";
    machineStocks.forEach(function (machineStock) {
        return MACHINES_IDS.forEach(function (cardId, index) {
            return machineStock.addItemType(cardId, 0, cardsurl, index);
        });
    });
}
function setupProjectCards(projectStocks) {
    var cardsurl = g_gamethemeurl + "img/projects.jpg";
    projectStocks.forEach(function (projectStock) {
        PROJECTS_IDS.forEach(function (cardId, index) {
            return projectStock.addItemType(cardId, 0, cardsurl, index);
        });
    });
}
function getMachineTooltip(type) {
    switch (type) {
        // blue
        case 11: return _("Earn 1 wood for each machine on the Bric-a-brac with wood in its production zone, including this one.");
        case 12: return _("Earn 1 charcoalium for each machine on the Bric-a-brac with charcoalium in its production zone, including this one.");
        case 13: return _("Earn 1 copper for each machine on the Bric-a-brac with copper in its production zone, including this one.");
        case 14: return _("Earn 1 crystal for each machine on the Bric-a-brac with crystal in its production zone, including this one.");
        case 15: return formatTextIcons(_("Choose a type of resource ([resource1]|[resource2]|[resource3]). Earn 1 resource of this type for each machine on the Bric-a-brac with the [resource9] symbol in its production zone, including this one."));
        // purple
        case 21: return _("Discard a machine from your hand and earn 2 resources of your choice from those needed to repair it.");
        case 22: return _("Discard 1 of the last 3 machines added to the Bric-a-brac before this one and earn 1 resource of your choice from those needed to repair it.");
        case 23: return _("Discard 1 of the last 2 machines added to the Bric-a-brac before this one and earn 1 resource of your choice from those needed to repair it and 1 charcoalium.");
        case 24: return _("You can exchange 1 charcoalium for 1 resource of your choice from the reserve and/or vice versa, up to three times total.");
        case 25: return _("Discard the last machine added to the Bric-a-brac before this one and earn 2 resources of your choice from those needed to repair it.");
        // red
        case 31: return _("Steal from your opponent 1 charcoalium and 1 machine taken randomly from their hand.");
        case 32: return _("Steal from your opponent 1 resource of your choice and 1 machine taken randomly from their hand.");
        case 33: return _("Your opponent must randomly discard all but 2 machines from their hand and return 2 charcoalium to the reserve.");
        case 34: return _("Your opponent must return 2 resources of your choice to the reserve.");
        // yellow
        case 41: return _("Draw 2 of the unused project tiles. Choose 1 to place face up in your workshop and return the other to the box. Only you can complete the project in your workshop.");
        case 42: return _("Copy the effect of 1 machine from the Bric-a-brac of your choice.");
    }
    return null;
}
function setupMachineCard(game, cardDiv, type) {
    game.addTooltipHtml(cardDiv.id, getMachineTooltip(type));
}
function getProjectTooltip(type) {
    switch (type) {
        // colors
        case 10: return _("You must have at least 1 machine of each color in your workshop.");
        case 11:
        case 12:
        case 13:
        case 14: return _("You must have at least 2 machines of the indicated color in your workshop.");
        // points
        case 20: return _("You must have at least 2 identical machines in your workshop.");
        case 21:
        case 22:
        case 23: return _("You must have at least 2 machines worth the indicated number of victory points in your workshop.");
        // resources
        case 31:
        case 32:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 38: return formatTextIcons(_("You must have machines in your workshop that have the indicated resources and/or charcoalium in their production zones. [resource9] resources do not count towards these objectives."));
    }
    return null;
}
function setupProjectCard(game, cardDiv, type) {
    game.addTooltipHtml(cardDiv.id, getProjectTooltip(type));
}
function moveToAnotherStock(sourceStock, destinationStock, uniqueId, cardId) {
    if (sourceStock === destinationStock) {
        return;
    }
    var sourceStockItemId = sourceStock.container_div.id + "_item_" + cardId;
    if (document.getElementById(sourceStockItemId)) {
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStockItemId);
        sourceStock.removeFromStockById(cardId);
    }
    else {
        console.warn(sourceStockItemId + " not found in ", sourceStock);
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStock.container_div.id);
    }
    var destinationDiv = document.getElementById(destinationStock.container_div.id + "_item_" + cardId);
    destinationDiv.style.zIndex = '10';
    setTimeout(function () { return destinationDiv.style.zIndex = 'unset'; }, 1000);
}
function addToStockWithId(destinationStock, uniqueId, cardId, from) {
    destinationStock.addToStockWithId(uniqueId, cardId, from);
    var destinationDiv = document.getElementById(destinationStock.container_div.id + "_item_" + cardId);
    destinationDiv.style.zIndex = '10';
    setTimeout(function () { return destinationDiv.style.zIndex = 'unset'; }, 1000);
}
function formatTextIcons(rawText) {
    return rawText
        .replace(/\[resource0\]/ig, '<span class="icon charcoalium"></span>')
        .replace(/\[resource1\]/ig, '<span class="icon wood"></span>')
        .replace(/\[resource2\]/ig, '<span class="icon copper"></span>')
        .replace(/\[resource3\]/ig, '<span class="icon crystal"></span>')
        .replace(/\[resource9\]/ig, '<span class="icon joker"></span>');
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var Table = /** @class */ (function () {
    function Table(game, players, projects, machines, resources) {
        var _this = this;
        this.game = game;
        this.projectStocks = [];
        this.machineStocks = [];
        var html = '';
        // points
        players.forEach(function (player) {
            return html += "<div id=\"player-" + player.id + "-point-marker\" class=\"point-marker " + (player.color.startsWith('00') ? 'blue' : 'red') + "\"></div>";
        });
        dojo.place(html, 'table');
        players.forEach(function (player) { return _this.setPoints(Number(player.id), Number(player.score)); });
        // projects
        html = '';
        for (var i = 1; i <= 6; i++) {
            html += "<div id=\"table-project-" + i + "\" class=\"table-project-stock\" style=\"left: " + 181 * (i - 1) + "px\"></div>";
        }
        dojo.place(html, 'table-projects');
        var _loop_1 = function (i) {
            this_1.projectStocks[i] = new ebg.stock();
            this_1.projectStocks[i].setSelectionAppearance('class');
            this_1.projectStocks[i].selectionClass = 'selected';
            this_1.projectStocks[i].create(this_1.game, $("table-project-" + i), PROJECT_WIDTH, PROJECT_HEIGHT);
            this_1.projectStocks[i].setSelectionMode(0);
            this_1.projectStocks[i].onItemCreate = function (cardDiv, type) { return setupProjectCard(game, cardDiv, type); };
            dojo.connect(this_1.projectStocks[i], 'onChangeSelection', this_1, function () {
                _this.projectStocks[i].getSelectedItems()
                    .filter(function (item) { return document.getElementById("table-project-" + i + "_item_" + item.id).classList.contains('disabled'); })
                    .forEach(function (item) { return _this.projectStocks[i].unselectItem(item.id); });
                _this.onProjectSelectionChanged();
            });
        };
        var this_1 = this;
        for (var i = 1; i <= 6; i++) {
            _loop_1(i);
        }
        setupProjectCards(this.projectStocks);
        var _loop_2 = function (i) {
            projects.filter(function (project) { return project.location_arg == i; }).forEach(function (project) { return _this.projectStocks[i].addToStockWithId(getUniqueId(project), '' + project.id); });
        };
        for (var i = 1; i <= 6; i++) {
            _loop_2(i);
        }
        // machines
        html = "<div id=\"table-machines\" class=\"machines\">";
        for (var i = 1; i <= 10; i++) {
            var firstRow = i <= 5;
            var left = (firstRow ? 204 : 0) + (i - (firstRow ? 1 : 6)) * 204;
            var top_1 = firstRow ? 0 : 210;
            html += "<div id=\"table-machine-spot-" + i + "\" class=\"machine-spot\" style=\"left: " + left + "px; top: " + top_1 + "px\"></div>";
        }
        html += "\n            <div id=\"machine-deck\" class=\"stockitem deck\"></div>\n            <div id=\"remaining-machine-counter\" class=\"remaining-counter\"></div>\n        </div>";
        dojo.place(html, 'table');
        var _loop_3 = function (i) {
            this_2.machineStocks[i] = new ebg.stock();
            this_2.machineStocks[i].setSelectionAppearance('class');
            this_2.machineStocks[i].selectionClass = 'selected';
            this_2.machineStocks[i].create(this_2.game, $("table-machine-spot-" + i), MACHINE_WIDTH, MACHINE_HEIGHT);
            this_2.machineStocks[i].setSelectionMode(0);
            this_2.machineStocks[i].onItemCreate = function (cardDiv, type) {
                var _a;
                setupMachineCard(game, cardDiv, type);
                var id = Number(cardDiv.id.split('_')[2]);
                var machine = machines.find(function (m) { return m.id == id; });
                if ((_a = machine === null || machine === void 0 ? void 0 : machine.resources) === null || _a === void 0 ? void 0 : _a.length) {
                    _this.addResources(0, machine.resources);
                }
            };
            dojo.connect(this_2.machineStocks[i], 'onChangeSelection', this_2, function () { return _this.onMachineSelectionChanged(_this.machineStocks[i].getSelectedItems(), _this.machineStocks[i].container_div.id); });
        };
        var this_2 = this;
        for (var i = 1; i <= 10; i++) {
            _loop_3(i);
        }
        setupMachineCards(this.machineStocks);
        var _loop_4 = function (i) {
            machines.filter(function (machine) { return machine.location_arg == i; }).forEach(function (machine) { return _this.machineStocks[i].addToStockWithId(getUniqueId(machine), '' + machine.id); });
        };
        for (var i = 1; i <= 10; i++) {
            _loop_4(i);
        }
        // resources
        for (var i = 0; i <= 3; i++) {
            var resourcesToPlace = resources[i];
            this.addResources(i, resourcesToPlace);
        }
    }
    Table.prototype.getSelectedProjectsIds = function () {
        var selectedIds = [];
        for (var i = 1; i <= 6; i++) {
            selectedIds.push.apply(selectedIds, this.projectStocks[i].getSelectedItems().map(function (item) { return Number(item.id); }));
        }
        return selectedIds;
    };
    Table.prototype.onProjectSelectionChanged = function () {
        var _a;
        (_a = this.onTableProjectSelectionChanged) === null || _a === void 0 ? void 0 : _a.call(this, this.getSelectedProjectsIds());
    };
    Table.prototype.onMachineSelectionChanged = function (items, stockId) {
        if (items.length == 1) {
            var cardId = Number(items[0].id);
            var datasetPayments = document.getElementById(stockId + "_item_" + cardId).dataset.payments;
            var payments = (datasetPayments === null || datasetPayments === void 0 ? void 0 : datasetPayments.length) && datasetPayments[0] == '[' ? JSON.parse(datasetPayments) : undefined;
            this.game.machineClick(cardId, 'table', payments);
        }
    };
    Table.prototype.setProjectSelectable = function (selectable) {
        this.projectStocks.forEach(function (stock) { return stock.setSelectionMode(selectable ? 2 : 0); });
        if (!selectable) {
            this.projectStocks.forEach(function (stock) { return stock.unselectAll(); });
        }
    };
    Table.prototype.setMachineSelectable = function (selectable) {
        this.machineStocks.forEach(function (stock) { return stock.setSelectionMode(selectable ? 1 : 0); });
        if (!selectable) {
            this.machineStocks.forEach(function (stock) { return stock.unselectAll(); });
        }
    };
    Table.prototype.setPoints = function (playerId, points) {
        var opponentId = this.game.getOpponentId(playerId);
        var opponentScore = this.game.getPlayerScore(opponentId);
        var equality = opponentScore === points;
        var playerShouldShift = equality && playerId > opponentId;
        var opponentShouldShift = equality && !playerShouldShift;
        var markerDiv = document.getElementById("player-" + playerId + "-point-marker");
        var top = points % 2 ? 40 : 52;
        var left = 16 + points * 46.2;
        if (playerShouldShift) {
            top -= 5;
            left -= 5;
        }
        markerDiv.style.transform = "translateX(" + left + "px) translateY(" + top + "px)";
        if (opponentShouldShift) {
            var opponentMarkerDiv = document.getElementById("player-" + opponentId + "-point-marker");
            if (opponentMarkerDiv) {
                opponentMarkerDiv.style.transform = "translateX(" + (left - 5) + "px) translateY(" + (top - 5) + "px)";
            }
        }
    };
    Table.prototype.machinePlayed = function (playerId, machine) {
        var fromHandId = "my-machines_item_" + machine.id;
        var from = document.getElementById(fromHandId) ? fromHandId : "player-icon-" + playerId;
        this.machineStocks[machine.location_arg].addToStockWithId(getUniqueId(machine), '' + machine.id, from);
        dojo.addClass("table-machine-spot-" + machine.location_arg + "_item_" + machine.id, 'selected');
    };
    Table.prototype.getDistance = function (p1, p2) {
        return Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
    };
    Table.prototype.getPlaceOnTable = function (placed) {
        var _this = this;
        var newPlace = {
            x: Math.random() * 228 + 16,
            y: Math.random() * 38 + 16,
        };
        var protection = 0;
        while (protection < 1000 && placed.some(function (place) { return _this.getDistance(newPlace, place) < 32; })) {
            newPlace.x = Math.random() * 228 + 16;
            newPlace.y = Math.random() * 38 + 16;
            protection++;
        }
        return newPlace;
    };
    Table.prototype.getPlaceOnMachine = function (placed) {
        return {
            x: 166,
            y: 166 - (32 * placed.length)
        };
    };
    Table.prototype.addResources = function (type, resources) {
        var _this = this;
        var toMachine = type == 0 && resources.length && resources[0].location === 'machine';
        var divId = "table-resources" + type;
        if (toMachine) {
            var machineId_1 = resources[0].location_arg;
            var stock = this.machineStocks.find(function (stock) { return stock === null || stock === void 0 ? void 0 : stock.items.find(function (item) { return Number(item.id) == machineId_1; }); });
            divId = stock.container_div.id + "_item_" + machineId_1;
        }
        var div = document.getElementById(divId);
        if (!div) {
            return;
        }
        var placed = div.dataset.placed ? JSON.parse(div.dataset.placed) : [];
        // add tokens
        resources.filter(function (resource) { return !placed.some(function (place) { return place.resourceId == resource.id; }); }).forEach(function (resource) {
            var newPlace = toMachine ? _this.getPlaceOnMachine(placed) : _this.getPlaceOnTable(placed);
            placed.push(__assign(__assign({}, newPlace), { resourceId: resource.id }));
            var resourceDivId = "resource" + type + "-" + resource.id;
            var resourceDiv = document.getElementById("resource" + type + "-" + resource.id);
            if (resourceDiv) {
                var originDiv = resourceDiv.parentElement;
                var originPlaced = originDiv.dataset.placed ? JSON.parse(originDiv.dataset.placed) : [];
                originDiv.dataset.placed = JSON.stringify(originPlaced.filter(function (place) { return place.resourceId != resource.id; }));
                var tableMachinesDiv = document.getElementById('table-machines');
                if ((tableMachinesDiv.contains(originDiv) && tableMachinesDiv.contains(div)) || originDiv.classList.contains('to_be_destroyed')) {
                    div.appendChild(resourceDiv);
                    console.log('outer', div.outerHTML);
                }
                else {
                    slideToObjectAndAttach(resourceDiv, divId, newPlace.x - 16, newPlace.y - 16);
                }
            }
            else {
                var html = "<div id=\"" + resourceDivId + "\"\n                    class=\"cube resource" + type + " aspect" + resource.id % (type == 0 ? 8 : 4) + "\" \n                    style=\"left: " + (newPlace.x - 16) + "px; top: " + (newPlace.y - 16) + "px;\"\n                ></div>";
                dojo.place(html, divId);
            }
        });
        div.dataset.placed = JSON.stringify(placed);
    };
    return Table;
}());
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player, side) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var color = player.color.startsWith('00') ? 'blue' : 'red';
        var html = "\n        <div id=\"player-table-" + this.playerId + "\" class=\"player-table whiteblock " + side + "\" style=\"background-color: #" + player.color + "40;\">\n            <div class=\"name-column " + color + " " + side + "\">\n                <div class=\"player-name\">" + player.name + "</div>\n                <div id=\"player-icon-" + this.playerId + "\" class=\"player-icon " + color + "\"></div>\n\n                <div class=\"player-resources " + side + "\">\n                    <div id=\"player" + this.playerId + "-resources1\"></div>\n                    <div id=\"player" + this.playerId + "-resources2\"></div>\n                    <div id=\"player" + this.playerId + "-resources3\"></div>\n                    <div id=\"player" + this.playerId + "-resources0\" class=\"top\"></div>\n                </div>\n            </div>\n            <div class=\"machines-and-projects\">\n                <div id=\"player-table-" + this.playerId + "-projects\"></div>\n                <div id=\"player-table-" + this.playerId + "-machines\"></div>\n            </div>\n        </div>";
        dojo.place(html, 'playerstables');
        // projects        
        this.projectStock = new ebg.stock();
        this.projectStock.setSelectionAppearance('class');
        this.projectStock.selectionClass = 'selected';
        this.projectStock.create(this.game, $("player-table-" + this.playerId + "-projects"), PROJECT_WIDTH, PROJECT_HEIGHT);
        this.projectStock.setSelectionMode(0);
        //this.projectStock.centerItems = true;
        this.projectStock.onItemCreate = function (cardDiv, type) { return setupProjectCard(game, cardDiv, type); };
        dojo.connect(this.projectStock, 'onChangeSelection', this, function () {
            _this.projectStock.getSelectedItems()
                .filter(function (item) { return document.getElementById("player-table-" + _this.playerId + "-projects_item_" + item.id).classList.contains('disabled'); })
                .forEach(function (item) { return _this.projectStock.unselectItem(item.id); });
            _this.onProjectSelectionChanged();
        });
        setupProjectCards([this.projectStock]);
        player.projects.forEach(function (project) { return _this.projectStock.addToStockWithId(getUniqueId(project), '' + project.id); });
        this.setProjectStockVisibility();
        // machines
        this.machineStock = new ebg.stock();
        this.machineStock.setSelectionAppearance('class');
        this.machineStock.selectionClass = 'selected';
        this.machineStock.create(this.game, $("player-table-" + this.playerId + "-machines"), MACHINE_WIDTH, MACHINE_HEIGHT);
        this.machineStock.setSelectionMode(0);
        this.machineStock.centerItems = true;
        this.machineStock.onItemCreate = function (cardDiv, type) { return setupMachineCard(game, cardDiv, type); };
        setupMachineCards([this.machineStock]);
        player.machines.forEach(function (machine) { return _this.machineStock.addToStockWithId(getUniqueId(machine), '' + machine.id); });
        // resources
        for (var i = 0; i <= 3; i++) {
            var resourcesToPlace = player.resources[i];
            this.addResources(i, resourcesToPlace);
        }
    }
    PlayerTable.prototype.onProjectSelectionChanged = function () {
        var _a;
        (_a = this.onPlayerProjectSelectionChanged) === null || _a === void 0 ? void 0 : _a.call(this, this.projectStock.getSelectedItems().map(function (item) { return Number(item.id); }));
    };
    PlayerTable.prototype.getDistance = function (p1, p2) {
        return Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
    };
    PlayerTable.prototype.getPlaceOnPlayerBoard = function (placed, type) {
        var _this = this;
        var xMaxShift = type ? 28 : 148;
        var yMaxShift = type ? 84 : 32;
        var newPlace = {
            x: Math.random() * xMaxShift,
            y: Math.random() * yMaxShift,
        };
        var protection = 0;
        while (protection < 1000 && placed.some(function (place) { return _this.getDistance(newPlace, place) < 32; })) {
            newPlace.x = Math.random() * xMaxShift;
            newPlace.y = Math.random() * yMaxShift;
            protection++;
        }
        return newPlace;
    };
    PlayerTable.prototype.addResources = function (type, resources) {
        var _this = this;
        var divId = "player" + this.playerId + "-resources" + type;
        var div = document.getElementById(divId);
        if (!div) {
            return;
        }
        var placed = div.dataset.placed ? JSON.parse(div.dataset.placed) : [];
        // add tokens
        resources.filter(function (resource) { return !placed.some(function (place) { return place.resourceId == resource.id; }); }).forEach(function (resource) {
            var newPlace = _this.getPlaceOnPlayerBoard(placed, type);
            placed.push(__assign(__assign({}, newPlace), { resourceId: resource.id }));
            var resourceDivId = "resource" + type + "-" + resource.id;
            var resourceDiv = document.getElementById("resource" + type + "-" + resource.id);
            if (resourceDiv) {
                var originDiv = resourceDiv.parentElement;
                var originPlaced = originDiv.dataset.placed ? JSON.parse(originDiv.dataset.placed) : [];
                originDiv.dataset.placed = JSON.stringify(originPlaced.filter(function (place) { return place.resourceId != resource.id; }));
                if (originDiv.classList.contains('to_be_destroyed')) {
                    div.appendChild(resourceDiv);
                }
                else {
                    slideToObjectAndAttach(resourceDiv, divId, newPlace.x, newPlace.y);
                }
            }
            else {
                var html = "<div id=\"" + resourceDivId + "\"\n                    class=\"cube resource" + type + " aspect" + resource.id % (type == 0 ? 8 : 4) + "\" \n                    style=\"left: " + newPlace.x + "px; top: " + newPlace.y + "px;\"\n                ></div>";
                dojo.place(html, divId);
            }
        });
        div.dataset.placed = JSON.stringify(placed);
    };
    PlayerTable.prototype.addWorkshopProjects = function (projects) {
        var _this = this;
        projects.forEach(function (project) { return addToStockWithId(_this.projectStock, getUniqueId(project), '' + project.id, 'page-title'); });
        this.setProjectStockVisibility();
    };
    PlayerTable.prototype.setProjectStockVisibility = function () {
        dojo.toggleClass("player-table-" + this.playerId + "-projects", 'empty', !this.projectStock.items.length);
    };
    PlayerTable.prototype.setProjectSelectable = function (selectable) {
        this.projectStock.setSelectionMode(selectable ? 2 : 0);
        if (!selectable) {
            this.projectStock.unselectAll();
        }
    };
    return PlayerTable;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var ANIMATION_MS = 500;
var ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0];
var LOCAL_STORAGE_ZOOM_KEY = 'Glow-zoom';
var isDebug = window.location.host == 'studio.boardgamearena.com';
var log = isDebug ? console.log.bind(window.console) : function () { };
var Glow = /** @class */ (function () {
    function Glow() {
        this.charcoaliumCounters = [];
        this.woodCounters = [];
        this.copperCounters = [];
        this.crystalCounters = [];
        this.playersTables = [];
        this.selectedPlayerProjectsIds = [];
        this.selectedTableProjectsIds = [];
        this.zoom = 1;
        this.clickAction = 'play';
        var zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (zoomStr) {
            this.zoom = Number(zoomStr);
        }
    }
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */
    Glow.prototype.setup = function (gamedatas) {
        log("Starting game setup");
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        /*this.createPlayerPanels(gamedatas);
        this.setHand(gamedatas.handMachines);
        this.table = new Table(this, Object.values(gamedatas.players), gamedatas.tableProjects, gamedatas.tableMachines, gamedatas.resources);
        this.table.onTableProjectSelectionChanged = selectProjectsIds => {
            this.selectedTableProjectsIds = selectProjectsIds;
            this.onProjectSelectionChanged();
        };
        this.createPlayerTables(gamedatas);

        this.machineCounter = new ebg.counter();
        this.machineCounter.create('remaining-machine-counter');
        this.setRemainingMachines(gamedatas.remainingMachines);

        this.projectCounter = new ebg.counter();
        this.projectCounter.create('remaining-project-counter');
        this.setRemainingProjects(gamedatas.remainingProjects);

        if (gamedatas.endTurn) {
            this.notif_lastTurn();
        }

        this.addHelp();*/
        this.setupNotifications();
        /*this.setupPreferences();

        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }*/
        log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Glow.prototype.onEnteringState = function (stateName, args) {
        log('Entering state: ' + stateName, args.args);
        switch (stateName) {
            case 'chooseAction':
                this.clickAction = 'play';
                this.onEnteringStateChooseAction(args.args);
                break;
            case 'choosePlayAction':
                this.onEnteringStateChoosePlayAction(args.args);
                break;
            case 'selectMachine':
                this.clickAction = 'select';
                this.onEnteringStateSelectMachine(args.args);
                break;
            case 'selectProject':
            case 'chooseProject':
                this.onEnteringStateChooseProject(args.args);
                break;
            case 'chooseProjectDiscardedMachine':
                this.onEnteringStateChooseProjectDiscardedMachine(args.args);
                break;
            case 'gameEnd':
                var lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    };
    Glow.prototype.onEnteringStateChooseAction = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.setHandSelectable(true);
            this.table.setMachineSelectable(true);
            this.getMachineStocks().forEach(function (stock) { return stock.items.forEach(function (item) {
                var machine = args.selectableMachines.find(function (machine) { return machine.id === Number(item.id); });
                var divId = stock.container_div.id + "_item_" + item.id;
                if (machine) {
                    document.getElementById(divId).dataset.payments = JSON.stringify(machine.payments);
                }
                else {
                    dojo.addClass(divId, 'disabled');
                }
            }); });
        }
    };
    Glow.prototype.onEnteringStateChoosePlayAction = function (args) {
        dojo.addClass("table-machine-spot-" + args.machine.location_arg + "_item_" + args.machine.id, 'selected');
    };
    Glow.prototype.onEnteringStateSelectMachine = function (args) {
        var stocks = this.getMachineStocks();
        stocks.forEach(function (stock) { return stock.items
            .filter(function (item) { return !args.selectableMachines.some(function (machine) { return machine.id === Number(item.id); }); })
            .forEach(function (item) { return dojo.addClass(stock.container_div.id + "_item_" + item.id, 'disabled'); }); });
        stocks.forEach(function (stock) { return stock.setSelectionMode(1); });
    };
    Glow.prototype.onEnteringStateChooseProject = function (args) {
        if (args.remainingProjects !== undefined) {
            this.setRemainingProjects(args.remainingProjects);
        }
        if (this.isCurrentPlayerActive()) {
            this.setHandSelectable(true);
            this.getPlayerTable(this.getPlayerId()).setProjectSelectable(true);
            this.table.setProjectSelectable(true);
            this.getProjectStocks().forEach(function (stock) { return stock.items
                .filter(function (item) { return !args.projects.some(function (project) { return project.id === Number(item.id); }); })
                .forEach(function (item) { return dojo.addClass(stock.container_div.id + "_item_" + item.id, 'disabled'); }); });
        }
    };
    Glow.prototype.onEnteringStateChooseProjectDiscardedMachine = function (args) {
        if (this.isCurrentPlayerActive()) {
            //this.discardedMachineSelector = new DiscardedMachineSelector(this, args.completeProjects);
        }
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    Glow.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'chooseAction':
                this.onLeavingChooseAction();
                break;
            case 'choosePlayAction':
                this.onLeavingChoosePlayAction();
                break;
            case 'selectMachine':
                this.clickAction = 'select';
                this.onLeavingStateSelectMachine();
            case 'selectProject':
            case 'chooseProject':
                this.onLeavingChooseProject();
                break;
            case 'chooseProjectDiscardedMachine':
                //this.discardedMachineSelector?.destroy();
                break;
        }
    };
    Glow.prototype.onLeavingChooseAction = function () {
        this.setHandSelectable(false);
        this.table.setMachineSelectable(false);
        dojo.query('.stockitem').removeClass('disabled');
        dojo.query('.stockitem').forEach(function (div) { return div.dataset.payments = ''; });
    };
    Glow.prototype.onLeavingChoosePlayAction = function () {
        dojo.query('.stockitem').removeClass('selected');
    };
    Glow.prototype.onLeavingStateSelectMachine = function () {
        var stocks = this.getMachineStocks();
        stocks.forEach(function (stock) { return stock.items
            .forEach(function (item) { return dojo.removeClass(stock.container_div.id + "_item_" + item.id, 'disabled'); }); });
        stocks.forEach(function (stock) { return stock.setSelectionMode(0); });
    };
    Glow.prototype.onLeavingChooseProject = function () {
        var _a;
        this.table.setProjectSelectable(false);
        (_a = this.getPlayerTable(this.getPlayerId())) === null || _a === void 0 ? void 0 : _a.setProjectSelectable(false);
        dojo.query('.stockitem').removeClass('disabled');
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Glow.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'choosePlayAction':
                    var choosePlayActionArgs_1 = args;
                    this.addActionButton('getCharcoalium-button', _('Get charcoalium') + formatTextIcons(" (" + choosePlayActionArgs_1.machine.points + " [resource0])"), function () { return _this.getCharcoalium(); });
                    if (choosePlayActionArgs_1.machine.produce == 9) {
                        var _loop_5 = function (i) {
                            this_3.addActionButton("getResource" + i + "-button", _('Get resource') + formatTextIcons(" ([resource" + i + "])"), function () { return _this.getResource(i); });
                        };
                        var this_3 = this;
                        for (var i = 1; i <= 3; i++) {
                            _loop_5(i);
                        }
                    }
                    else {
                        this.addActionButton('getResource-button', _('Get resource') + formatTextIcons(" ([resource" + choosePlayActionArgs_1.machine.produce + "])"), function () { return _this.getResource(choosePlayActionArgs_1.machine.produce); });
                        if (choosePlayActionArgs_1.machine.type == 1 || choosePlayActionArgs_1.machine.produce == 0) {
                            // for those machines, getting 1 resource is not the best option, so we "unlight" them
                            dojo.removeClass('getResource-button', 'bgabutton_blue');
                            dojo.addClass('getResource-button', 'bgabutton_gray');
                        }
                    }
                    this.addActionButton('applyEffect-button', _('Apply effect') + (" <div class=\"effect effect" + MACHINES_IDS.indexOf(getUniqueId(choosePlayActionArgs_1.machine)) + "\"></div>"), function () { return _this.applyEffect(); });
                    if (!choosePlayActionArgs_1.canApplyEffect) {
                        dojo.addClass('applyEffect-button', 'disabled');
                    }
                    this.addTooltipHtml('applyEffect-button', getMachineTooltip(getUniqueId(choosePlayActionArgs_1.machine)));
                    break;
                case 'selectResource':
                    var selectResourceArgs = args;
                    selectResourceArgs.possibleCombinations.forEach(function (combination, index) {
                        return _this.addActionButton("selectResourceCombination" + index + "-button", formatTextIcons(combination.map(function (type) { return "[resource" + type + "]"; }).join('')), function () { return _this.selectResource(combination); });
                    });
                    break;
                case 'selectProject':
                    var selectProjectArgs = args;
                    selectProjectArgs.projects.forEach(function (project) {
                        return _this.addActionButton("selectProject" + project.id + "-button", "<div class=\"project project" + PROJECTS_IDS.indexOf(getUniqueId(project)) + "\"></div>", function () { return _this.selectProject(project.id); });
                    });
                    break;
                case 'selectExchange':
                    var selectExchangeArgs = args;
                    selectExchangeArgs.possibleExchanges.forEach(function (possibleExchange, index) {
                        return _this.addActionButton("selectExchange" + index + "-button", formatTextIcons("[resource" + possibleExchange.from + "] &#x21E8; [resource" + possibleExchange.to + "]"), function () { return _this.selectExchange(possibleExchange); });
                    });
                    this.addActionButton('skipExchange-button', _('Skip'), function () { return _this.skipExchange(); }, null, null, 'red');
                    break;
                case 'chooseProject':
                    this.addActionButton('selectProjects-button', _('Complete projects'), function () { return _this.selectProjects(_this.selectedPlayerProjectsIds.concat(_this.selectedTableProjectsIds)); });
                    this.addActionButton('skipProjects-button', _('Skip'), function () { return _this.skipSelectProjects(); }, null, null, 'red');
                    dojo.toggleClass('selectProjects-button', 'disabled', !this.table.getSelectedProjectsIds().length);
                    dojo.toggleClass('skipProjects-button', 'disabled', !!this.table.getSelectedProjectsIds().length);
                    break;
                case 'chooseProjectDiscardedMachine':
                    this.addActionButton('selectProjectDiscardedMachine-button', _('Discard selected machines'), function () { return _this.discardSelectedMachines(); });
                    break;
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    Glow.prototype.setZoom = function (zoom) {
        if (zoom === void 0) { zoom = 1; }
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, '' + this.zoom);
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);
        var div = document.getElementById('full-table');
        if (zoom === 1) {
            div.style.transform = '';
            div.style.margin = '';
        }
        else {
            div.style.transform = "scale(" + zoom + ")";
            div.style.margin = "0 " + ZOOM_LEVELS_MARGIN[newIndex] + "% " + (1 - zoom) * -100 + "% 0";
        }
        __spreadArray([this.playerMachineHand], this.playersTables.map(function (pt) { return pt.machineStock; })).forEach(function (stock) { return stock.updateDisplay(); });
        document.getElementById('zoom-wrapper').style.height = div.getBoundingClientRect().height + "px";
    };
    Glow.prototype.zoomIn = function () {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    Glow.prototype.zoomOut = function () {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    Glow.prototype.setupPreferences = function () {
        var _this = this;
        // Extract the ID and value from the UI control
        var onchange = function (e) {
            var match = e.target.id.match(/^preference_control_(\d+)$/);
            if (!match) {
                return;
            }
            var prefId = +match[1];
            var prefValue = +e.target.value;
            _this.prefs[prefId].value = prefValue;
            _this.onPreferenceChange(prefId, prefValue);
        };
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query("#ingame_menu_content .preference_control"), function (el) { return onchange({ target: el }); });
    };
    Glow.prototype.onPreferenceChange = function (prefId, prefValue) {
        switch (prefId) {
            // KEEP
            case 201:
                document.getElementById('full-table').appendChild(document.getElementById(prefValue == 2 ? 'table-wrapper' : 'playerstables'));
                break;
        }
    };
    Glow.prototype.onProjectSelectionChanged = function () {
        var selectionLength = this.selectedPlayerProjectsIds.length + this.selectedTableProjectsIds.length;
        dojo.toggleClass('selectProjects-button', 'disabled', !selectionLength);
        dojo.toggleClass('skipProjects-button', 'disabled', !!selectionLength);
    };
    Glow.prototype.setHand = function (machines) {
        var _this = this;
        this.playerMachineHand = new ebg.stock();
        this.playerMachineHand.create(this, $('my-machines'), MACHINE_WIDTH, MACHINE_HEIGHT);
        this.playerMachineHand.setSelectionMode(1);
        this.playerMachineHand.setSelectionAppearance('class');
        this.playerMachineHand.selectionClass = 'selected';
        this.playerMachineHand.centerItems = true;
        this.playerMachineHand.onItemCreate = function (cardDiv, type) { return setupMachineCard(_this, cardDiv, type); };
        dojo.connect(this.playerMachineHand, 'onChangeSelection', this, function () { return _this.onPlayerMachineHandSelectionChanged(_this.playerMachineHand.getSelectedItems()); });
        setupMachineCards([this.playerMachineHand]);
        machines.forEach(function (machine) { return _this.playerMachineHand.addToStockWithId(getUniqueId(machine), '' + machine.id); });
        var player = Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) === _this.getPlayerId(); });
        if (player) {
            var color = player.color.startsWith('00') ? 'blue' : 'red';
            dojo.addClass('my-hand-label', color);
            // document.getElementById('myhand-wrap').style.backgroundColor = `#${player.color}40`;
        }
    };
    Glow.prototype.getProjectStocks = function () {
        return __spreadArray(__spreadArray([], this.table.projectStocks.slice(1)), this.playersTables.map(function (pt) { return pt.projectStock; }));
    };
    Glow.prototype.getMachineStocks = function () {
        return __spreadArray(__spreadArray([this.playerMachineHand], this.table.machineStocks.slice(1)), this.playersTables.map(function (pt) { return pt.machineStock; }));
    };
    Glow.prototype.setHandSelectable = function (selectable) {
        this.playerMachineHand.setSelectionMode(selectable ? 1 : 0);
    };
    Glow.prototype.onPlayerMachineHandSelectionChanged = function (items) {
        if (items.length == 1) {
            var card = items[0];
            this.machineClick(card.id, 'hand');
        }
    };
    Glow.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    Glow.prototype.getOpponentId = function (playerId) {
        return Number(Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) != playerId; }).id);
    };
    Glow.prototype.getPlayerScore = function (playerId) {
        var _a, _b;
        return (_b = (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.getValue()) !== null && _b !== void 0 ? _b : Number(this.gamedatas.players[playerId].score);
    };
    Glow.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    Glow.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // charcoalium & resources counters
            dojo.place("<div class=\"counters\">\n                <div id=\"charcoalium-counter-wrapper-" + player.id + "\" class=\"charcoalium-counter\">\n                    <div class=\"icon charcoalium\"></div> \n                    <span id=\"charcoalium-counter-" + player.id + "\"></span>\n                </div>\n            </div>\n            <div class=\"counters\">\n                <div id=\"wood-counter-wrapper-" + player.id + "\" class=\"wood-counter\">\n                    <div class=\"icon wood\"></div> \n                    <span id=\"wood-counter-" + player.id + "\"></span>\n                </div>\n                <div id=\"copper-counter-wrapper-" + player.id + "\" class=\"copper-counter\">\n                    <div class=\"icon copper\"></div> \n                    <span id=\"copper-counter-" + player.id + "\"></span>\n                </div>\n                <div id=\"crystal-counter-wrapper-" + player.id + "\" class=\"crystal-counter\">\n                    <div class=\"icon crystal\"></div> \n                    <span id=\"crystal-counter-" + player.id + "\"></span>\n                </div>\n            </div>", "player_board_" + player.id);
            var charcoaliumCounter = new ebg.counter();
            charcoaliumCounter.create("charcoalium-counter-" + playerId);
            charcoaliumCounter.setValue(player.resources[0].length);
            _this.charcoaliumCounters[playerId] = charcoaliumCounter;
            var woodCounter = new ebg.counter();
            woodCounter.create("wood-counter-" + playerId);
            woodCounter.setValue(player.resources[1].length);
            _this.woodCounters[playerId] = woodCounter;
            var copperCounter = new ebg.counter();
            copperCounter.create("copper-counter-" + playerId);
            copperCounter.setValue(player.resources[2].length);
            _this.copperCounters[playerId] = copperCounter;
            var crystalCounter = new ebg.counter();
            crystalCounter.create("crystal-counter-" + playerId);
            crystalCounter.setValue(player.resources[3].length);
            _this.crystalCounters[playerId] = crystalCounter;
            if (player.playerNo == 1) {
                dojo.place("<div id=\"player-icon-first-player\" class=\"player-icon first-player\"></div>", "player_board_" + player.id);
                _this.addTooltipHtml('player-icon-first-player', _("First player"));
            }
        });
        this.addTooltipHtmlToClass('charcoalium-counter', _("Charcoalium"));
        this.addTooltipHtmlToClass('wood-counter', _("Wood"));
        this.addTooltipHtmlToClass('copper-counter', _("Copper"));
        this.addTooltipHtmlToClass('crystal-counter', _("Crystal"));
    };
    Glow.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex)), players.slice(0, playerIndex)) : players;
        orderedPlayers.forEach(function (player, index) {
            return _this.createPlayerTable(gamedatas, Number(player.id), index ? 'right' : 'left');
        });
    };
    Glow.prototype.createPlayerTable = function (gamedatas, playerId, side) {
        var _this = this;
        var playerTable = new PlayerTable(this, gamedatas.players[playerId], side);
        this.playersTables.push(playerTable);
        playerTable.onPlayerProjectSelectionChanged = function (selectProjectsIds) {
            _this.selectedPlayerProjectsIds = selectProjectsIds;
            _this.onProjectSelectionChanged();
        };
    };
    Glow.prototype.machineClick = function (id, from, payments) {
        var _this = this;
        if (this.clickAction === 'select') {
            this.selectMachine(id);
        }
        else if (this.clickAction === 'play') {
            /*const paymentDiv = document.getElementById('paymentButtons');
            if (paymentDiv) {
                paymentDiv.innerHTML = '';
            } else {
                dojo.place(`<div id="paymentButtons"></div>`, 'generalactions')
            }*/
            document.querySelectorAll("[id^='selectPaymentButton']").forEach(function (elem) { return dojo.destroy(elem.id); });
            if (from === 'hand') {
                this.playMachine(id);
            }
            else if (from === 'table') {
                if (payments.length > 1) {
                    payments.forEach(function (payment, index) {
                        var label = dojo.string.substitute(_('Use ${jokers} as ${unpaidResources} and pay ${paidResources}'), {
                            jokers: payment.jokers.map(function (_) { return '[resource9]'; }).join(''),
                            unpaidResources: payment.jokers.map(function (joker) { return "[resource" + joker + "]"; }).join(''),
                            paidResources: payment.remainingCost.filter(function (resource) { return resource > 0; }).map(function (resource) { return "[resource" + resource + "]"; }).join(''),
                        });
                        _this.addActionButton("selectPaymentButton" + index + "-button", formatTextIcons(label), function () { return _this.repairMachine(id, payment); });
                    });
                }
                else {
                    this.repairMachine(id, payments[0]);
                }
            }
        }
    };
    Glow.prototype.playMachine = function (id) {
        if (!this.checkAction('playMachine')) {
            return;
        }
        this.takeAction('playMachine', {
            id: id
        });
    };
    Glow.prototype.repairMachine = function (id, payment) {
        if (!this.checkAction('repairMachine')) {
            return;
        }
        var base64 = btoa(JSON.stringify(payment));
        this.takeAction('repairMachine', {
            id: id,
            payment: base64
        });
    };
    Glow.prototype.getCharcoalium = function () {
        if (!this.checkAction('getCharcoalium')) {
            return;
        }
        this.takeAction('getCharcoalium');
    };
    Glow.prototype.getResource = function (resource) {
        if (!this.checkAction('getResource')) {
            return;
        }
        this.takeAction('getResource', {
            resource: resource
        });
    };
    Glow.prototype.applyEffect = function () {
        if (!this.checkAction('applyEffect')) {
            return;
        }
        this.takeAction('applyEffect');
    };
    Glow.prototype.selectProjects = function (ids) {
        if (!this.checkAction('selectProjects')) {
            return;
        }
        this.takeAction('selectProjects', {
            ids: ids.join(',')
        });
    };
    Glow.prototype.skipSelectProjects = function () {
        if (!this.checkAction('skipSelectProjects')) {
            return;
        }
        this.takeAction('skipSelectProjects');
    };
    Glow.prototype.selectResource = function (resourcesTypes) {
        if (!this.checkAction('selectResource')) {
            return;
        }
        this.takeAction('selectResource', {
            resourcesTypes: resourcesTypes.join(',')
        });
    };
    Glow.prototype.selectMachine = function (id) {
        if (!this.checkAction('selectMachine')) {
            return;
        }
        this.takeAction('selectMachine', {
            id: id
        });
    };
    Glow.prototype.selectProject = function (id) {
        if (!this.checkAction('selectProject')) {
            return;
        }
        this.takeAction('selectProject', {
            id: id
        });
    };
    Glow.prototype.selectExchange = function (exchange) {
        if (!this.checkAction('selectExchange')) {
            return;
        }
        this.takeAction('selectExchange', exchange);
    };
    Glow.prototype.skipExchange = function () {
        if (!this.checkAction('skipExchange')) {
            return;
        }
        this.takeAction('skipExchange');
    };
    Glow.prototype.discardSelectedMachines = function () {
        if (!this.checkAction('discardSelectedMachines')) {
            return;
        }
        var base64 = btoa(JSON.stringify(/*this.discardedMachineSelector.getCompleteProjects()*/ 'TODO'));
        this.takeAction('discardSelectedMachines', {
            completeProjects: base64
        });
    };
    Glow.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/glow/glow/" + action + ".html", data, this, function () { });
    };
    Glow.prototype.setPoints = function (playerId, points) {
        var _a;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(points);
        this.table.setPoints(playerId, points);
    };
    Glow.prototype.setResourceCount = function (playerId, resource, number) {
        var counters = [this.charcoaliumCounters, this.woodCounters, this.copperCounters, this.crystalCounters];
        counters[resource][playerId].toValue(number);
    };
    Glow.prototype.addHelp = function () {
        var _this = this;
        dojo.place("<button id=\"glow-help-button\">?</button>", 'left-side');
        dojo.connect($('glow-help-button'), 'onclick', this, function () { return _this.showHelp(); });
    };
    Glow.prototype.showHelp = function () {
        if (!this.helpDialog) {
            this.helpDialog = new ebg.popindialog();
            this.helpDialog.create('glowHelpDialog');
            this.helpDialog.setTitle(_("Cards help"));
            var html = "<div id=\"help-popin\">\n                <h1>" + _("Machines effects") + "</h1>\n                <div id=\"help-machines\" class=\"help-section\">\n                    <table>";
            MACHINES_IDS.forEach(function (number, index) { return html += "<tr><td><div id=\"machine" + index + "\" class=\"machine\"></div></td><td>" + getMachineTooltip(number) + "</td></tr>"; });
            html += "</table>\n                </div>\n                <h1>" + _("Projects") + "</h1>\n                <div id=\"help-projects\" class=\"help-section\">\n                    <table><tr><td class=\"grid\">";
            PROJECTS_IDS.slice(1, 5).forEach(function (number, index) { return html += "<div id=\"project" + (index + 1) + "\" class=\"project\"></div>"; });
            html += "</td></tr><tr><td>" + getProjectTooltip(11) + "</td></tr>\n                <tr><td><div id=\"project0\" class=\"project\"></div></td></tr><tr><td>" + getProjectTooltip(10) + "</td></tr><tr><td class=\"grid\">";
            PROJECTS_IDS.slice(6, 9).forEach(function (number, index) { return html += "<div id=\"project" + (index + 6) + "\" class=\"project\"></div>"; });
            html += "</td></tr><tr><td>" + getProjectTooltip(21) + "</td></tr>\n                <tr><td><div id=\"project5\" class=\"project\"></div></td></tr><tr><td>" + getProjectTooltip(20) + "</td></tr><tr><td class=\"grid\">";
            PROJECTS_IDS.slice(9).forEach(function (number, index) { return html += "<div id=\"project" + (index + 9) + "\" class=\"project\"></div>"; });
            html += "</td></tr><tr><td>" + getProjectTooltip(31) + "</td></tr></table>\n                </div>\n            </div>";
            // Show the dialog
            this.helpDialog.setContent(html);
        }
        this.helpDialog.show();
    };
    Glow.prototype.setRemainingMachines = function (remainingMachines) {
        this.machineCounter.setValue(remainingMachines);
        var visibility = remainingMachines > 0 ? 'visible' : 'hidden';
        document.getElementById('machine-deck').style.visibility = visibility;
        document.getElementById('remaining-machine-counter').style.visibility = visibility;
    };
    Glow.prototype.setRemainingProjects = function (remainingProjects) {
        this.projectCounter.setValue(remainingProjects);
        var visibility = remainingProjects > 0 ? 'visible' : 'hidden';
        document.getElementById('project-deck').style.visibility = visibility;
        document.getElementById('remaining-project-counter').style.visibility = visibility;
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your glow.game.php file.

    */
    Glow.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        var notifs = [
            ['machinePlayed', ANIMATION_MS],
            ['machineRepaired', ANIMATION_MS],
            ['tableMove', ANIMATION_MS],
            ['addMachinesToHand', ANIMATION_MS],
            ['points', 1],
            ['lastTurn', 1],
            ['addResources', ANIMATION_MS],
            ['removeResources', ANIMATION_MS],
            ['discardHandMachines', ANIMATION_MS],
            ['discardPlayerMachines', ANIMATION_MS],
            ['discardTableMachines', ANIMATION_MS],
            ['removeProject', ANIMATION_MS],
            ['addWorkshopProjects', ANIMATION_MS],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_" + notif[0]);
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Glow.prototype.notif_machinePlayed = function (notif) {
        this.playerMachineHand.removeFromStockById('' + notif.args.machine.id);
        this.table.machinePlayed(notif.args.playerId, notif.args.machine);
    };
    Glow.prototype.notif_machineRepaired = function (notif) {
        moveToAnotherStock(this.table.machineStocks[notif.args.machineSpot], this.getPlayerTable(notif.args.playerId).machineStock, getUniqueId(notif.args.machine), '' + notif.args.machine.id);
    };
    Glow.prototype.notif_tableMove = function (notif) {
        var _this = this;
        Object.keys(notif.args.moved).forEach(function (key) {
            var _a;
            var originalSpot = Number(key);
            var machine = notif.args.moved[key];
            moveToAnotherStock(_this.table.machineStocks[originalSpot], _this.table.machineStocks[machine.location_arg], getUniqueId(machine), '' + machine.id);
            if ((_a = machine.resources) === null || _a === void 0 ? void 0 : _a.length) {
                _this.table.addResources(0, machine.resources);
            }
        });
    };
    Glow.prototype.notif_addMachinesToHand = function (notif) {
        var _this = this;
        var from = undefined;
        if (notif.args.from === 0) {
            from = 'machine-deck';
        }
        else if (notif.args.from > 0) {
            from = "player-icon-" + notif.args.from;
        }
        notif.args.machines.forEach(function (machine) { return addToStockWithId(_this.playerMachineHand, getUniqueId(machine), '' + machine.id, from); });
        if (notif.args.remainingMachines !== undefined) {
            this.setRemainingMachines(notif.args.remainingMachines);
        }
    };
    Glow.prototype.notif_addWorkshopProjects = function (notif) {
        this.getPlayerTable(notif.args.playerId).addWorkshopProjects(notif.args.projects);
    };
    Glow.prototype.notif_points = function (notif) {
        this.setPoints(notif.args.playerId, notif.args.points);
    };
    Glow.prototype.notif_addResources = function (notif) {
        this.setResourceCount(notif.args.playerId, notif.args.resourceType, notif.args.count);
        this.setResourceCount(notif.args.opponentId, notif.args.resourceType, notif.args.opponentCount);
        this.getPlayerTable(notif.args.playerId).addResources(notif.args.resourceType, notif.args.resources);
    };
    Glow.prototype.notif_removeResources = function (notif) {
        this.setResourceCount(notif.args.playerId, notif.args.resourceType, notif.args.count);
        this.table.addResources(notif.args.resourceType, notif.args.resources);
    };
    Glow.prototype.notif_discardHandMachines = function (notif) {
        var _this = this;
        notif.args.machines.forEach(function (machine) { return _this.playerMachineHand.removeFromStockById('' + machine.id); });
    };
    Glow.prototype.notif_discardPlayerMachines = function (notif) {
        var _this = this;
        notif.args.machines.forEach(function (machine) { return _this.getPlayerTable(machine.location_arg).machineStock.removeFromStockById('' + machine.id); });
    };
    Glow.prototype.notif_discardTableMachines = function (notif) {
        var _this = this;
        notif.args.machines.forEach(function (machine) { return _this.table.machineStocks[machine.location_arg].removeFromStockById('' + machine.id); });
    };
    Glow.prototype.notif_removeProject = function (notif) {
        this.getProjectStocks().forEach(function (stock) { return stock.removeFromStockById('' + notif.args.project.id); });
    };
    Glow.prototype.notif_lastTurn = function () {
        if (document.getElementById('last-round')) {
            return;
        }
        dojo.place("<div id=\"last-round\">\n            " + _("This is the last round of the game!") + "\n        </div>", 'page-title');
    };
    Glow.prototype.getMachineColor = function (color) {
        switch (color) {
            case 1: return '#006fa1';
            case 2: return '#702c91';
            case 3: return '#a72c32';
            case 4: return '#c48b10';
        }
        return null;
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    Glow.prototype.format_string_recursive = function (log, args) {
        var _this = this;
        try {
            if (log && args && !args.processed) {
                // Representation of the color of a card
                if (typeof args.machine_type == 'string' && args.machine_type[0] != '<' && typeof args.machine == 'object') {
                    args.machine_type = "<strong style=\"color: " + this.getMachineColor(args.machine.type) + "\">" + _(args.machine_type) + "</strong>";
                }
                ['resource', 'resourceFrom', 'resourceTo'].forEach(function (argNameStart) {
                    if (typeof args[argNameStart + "Name"] == 'string' && typeof args[argNameStart + "Type"] == 'number' && args[argNameStart + "Name"][0] != '<') {
                        args[argNameStart + "Name"] = formatTextIcons("[resource" + args[argNameStart + "Type"] + "]");
                    }
                });
                if (typeof args.machineImage == 'number') {
                    args.machineImage = "<div class=\"machine machine" + MACHINES_IDS.indexOf(args.machineImage) + "\"></div>";
                }
                if (typeof args.projectImage == 'number') {
                    args.projectImage = "<div class=\"project project" + PROJECTS_IDS.indexOf(args.projectImage) + "\"></div>";
                }
                if (typeof args.machineEffect == 'object') {
                    var uniqueId_1 = getUniqueId(args.machineEffect);
                    var id_1 = "action-bar-effect" + uniqueId_1;
                    args.machineEffect = "<div id=\"" + id_1 + "\" class=\"effect-in-text effect effect" + MACHINES_IDS.indexOf(uniqueId_1) + "\"></div>";
                    setTimeout(function () {
                        var effectImage = document.getElementById(id_1);
                        if (effectImage) {
                            _this.addTooltipHtml(id_1, getMachineTooltip(uniqueId_1));
                        }
                    }, 200);
                }
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    return Glow;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.glow", ebg.core.gamegui, new Glow());
});
