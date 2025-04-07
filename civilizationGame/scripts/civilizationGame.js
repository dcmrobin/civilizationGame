// Game constants
const TILE_TYPES = {
    OCEAN: { name: 'Ocean', moveCost: 1, food: 1, production: 0, gold: 1, color: 'ocean' },
    COAST: { name: 'Coast', moveCost: 1, food: 2, production: 0, gold: 0, color: 'coast' },
    GRASSLAND: { name: 'Grassland', moveCost: 1, food: 1, production: 1, gold: 0, color: 'grassland' },
    PLAINS: { name: 'Plains', moveCost: 1, food: 1, production: 1, gold: 0, color: 'plains' },
    DESERT: { name: 'Desert', moveCost: 2, food: 0, production: 0, gold: 0, color: 'desert' },
    MOUNTAINS: { name: 'Mountains', moveCost: 3, food: 0, production: 1, gold: 1, color: 'mountains' },
    SNOW: { name: 'Snow', moveCost: 4, food: 0, production: -1, gold: 0, color: 'snow' },
    FOREST: { name: 'Forest', moveCost: 2, food: 2, production: 1, gold: 0, color: 'forest' }
};

const UNIT_TYPES = {
    SETTLER: { name: 'Settler', description: "Able to found cities", cost: 30, goldCost: 50, strength: 0, move: 1, production: ['CITY'], foodConsumption: 2 },
    SCOUT: { name: 'Scout', cost: 5, description: "Able to move quicker over harder terrain", goldCost: 10, strength: 5, move: 2, production: ['CITY'], foodConsumption: 1 },
    WARRIOR: { name: 'Warrior', description: "Basic attack unit", cost: 10, goldCost: 30, strength: 20, move: 1, range: 1, production: ['CITY'], foodConsumption: 1 },
    ARCHER: { name: 'Archer', description: "Ranged attack unit", cost: 20, goldCost: 40, strength: 10, move: 1, range: 2, production: ['CITY'], requires: 'ARCHERY', foodConsumption: 1 },
    SPEARMAN: { name: 'Spearman', description: "Stronger attack unit", cost: 20, goldCost: 50, strength: 30, move: 1, range: 1, production: ['CITY'], requires: 'BRONZE_WORKING', foodConsumption: 1 },
    GALLEY: { name: 'Galley', description: "uh", cost: 30, goldCost: 120, strength: 10, move: 3, production: ['PORT'], requires: 'SEAFARING', naval: true, foodConsumption: 3 }
};

// Building types
const BUILDING_TYPES = {
    GRANARY: { 
        name: 'Granary', 
        goldCost: 80, 
        productionCost: 40, 
        requires: 'POTTERY',
        description: 'Provides +2 food to cities within 2 tiles',
        effects: {
            food: 2
        },
        constructionTurns: 4,
        icon: 'GR',
        color: '#8B4513',
        health: 50
    },
    LIBRARY: { 
        name: 'Library', 
        goldCost: 100, 
        productionCost: 60, 
        requires: 'WRITING',
        description: 'Increases research output by 10% in nearby cities',
        effects: {
            researchMultiplier: 1.1
        },
        constructionTurns: 5,
        icon: 'LB',
        color: '#0047ab',
        health: 50
    }
};

const TECH_TREE = {
    POTTERY: { name: 'Pottery', cost: 50, leadsTo: ['WRITING'], description: 'Allows Granary building' },
    WRITING: { name: 'Writing', cost: 80, leadsTo: ['PHILOSOPHY'], description: 'Allows Libraries and diplomatic agreements' },
    PHILOSOPHY: { name: 'Philosophy', cost: 120, leadsTo: ['EDUCATION'], description: 'Increases research output' },
    ARCHERY: { name: 'Archery', cost: 60, leadsTo: ['MATHEMATICS'], description: 'Allows Archer units' },
    MATHEMATICS: { name: 'Mathematics', cost: 100, leadsTo: ['PHYSICS'], description: 'Improves city defenses' },
    BRONZE_WORKING: { name: 'Bronze Working', cost: 80, leadsTo: ['IRON_WORKING'], description: 'Allows Spearman units' },
    IRON_WORKING: { name: 'Iron Working', cost: 120, leadsTo: ['STEEL'], description: 'Allows Swordsman units' },
    EDUCATION: { name: 'Education', cost: 150, leadsTo: ['SCIENTIFIC_THEORY'], description: 'Greatly increases research' },
    SCIENTIFIC_THEORY: { name: 'Scientific Theory', cost: 200, leadsTo: ['BIOLOGY'], description: 'Allows Universities' }
};

// Game state
const gameState = {
    map: [],
    players: [],
    currentPlayer: 0,
    turn: 1,
    selectedUnit: null,
    selectedCity: null,
    technologies: {},
    unitDestinations: {},
    highlightedTiles: [],
    mapDirty: true,
    buildings: [], // Array to store all buildings in the game
    buildingConstruction: null // Tracks current building being placed
};

// Perlin noise implementation (unchanged)
const Perlin = {
    gradients: {},
    dotGridGradient(ix, iy, x, y) {
        const gradient = this.gradients[`${ix},${iy}`] || this.randomGradient(ix, iy);
        const dx = x - ix;
        const dy = y - iy;
        return dx * gradient[0] + dy * gradient[1];
    },
    randomGradient(ix, iy) {
        const angle = Math.random() * 2 * Math.PI;
        const gradient = [Math.cos(angle), Math.sin(angle)];
        this.gradients[`${ix},${iy}`] = gradient;
        return gradient;
    },
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    },
    lerp(a, b, t) {
        return a + t * (b - a);
    },
    noise(x, y) {
        const x0 = Math.floor(x);
        const x1 = x0 + 1;
        const y0 = Math.floor(y);
        const y1 = y0 + 1;

        const sx = this.fade(x - x0);
        const sy = this.fade(y - y0);

        const n0 = this.dotGridGradient(x0, y0, x, y);
        const n1 = this.dotGridGradient(x1, y0, x, y);
        const ix0 = this.lerp(n0, n1, sx);

        const n2 = this.dotGridGradient(x0, y1, x, y);
        const n3 = this.dotGridGradient(x1, y1, x, y);
        const ix1 = this.lerp(n2, n3, sx);

        return this.lerp(ix0, ix1, sy);
    }
};

// Show the Help Panel
function showHelp() {
    document.getElementById('help-panel').style.display = 'block';
}

// Hide the Help Panel
function hideHelp() {
    document.getElementById('help-panel').style.display = 'none';
}

function centerViewportOnPlayer() {
    const humanPlayer = gameState.players[0];
    let targetX = 0;
    let targetY = 0;

    if (humanPlayer.cities.length > 0) {
        targetX = humanPlayer.cities[0].x;
        targetY = humanPlayer.cities[0].y;
    } else if (humanPlayer.units.length > 0) {
        targetX = humanPlayer.units[0].x;
        targetY = humanPlayer.units[0].y;
    }

    const tileSize = 20;
    const viewportWidth = document.getElementById('map-container').offsetWidth;
    const viewportHeight = document.getElementById('map-container').offsetHeight;

    const scrollLeft = targetX * tileSize - viewportWidth / 2 + tileSize / 2;
    const scrollTop = targetY * tileSize - viewportHeight / 2 + tileSize / 2;

    const mapContainer = document.getElementById('map-container');
    mapContainer.scrollLeft = Math.max(0, scrollLeft);
    mapContainer.scrollTop = Math.max(0, scrollTop);
}

// Initialize the game
function initGame() {
    createMap();
    createPlayers();
    placePlayers();
    renderInitialMap();
    updateUI();
    centerViewportOnPlayer();
    
    // Set up event listeners
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    document.getElementById('diplomacy-btn').addEventListener('click', showDiplomacy);
    document.getElementById('tech-btn').addEventListener('click', showTechTree);
    document.getElementById('close-diplomacy').addEventListener('click', hideDiplomacy);
    document.getElementById('close-tech').addEventListener('click', hideTechTree);
    document.getElementById('close-city').addEventListener('click', hideCityPanel);
    document.getElementById('help-btn').addEventListener('click', showHelp);
    document.getElementById('close-help').addEventListener('click', hideHelp);
    document.getElementById('map').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const tile = e.target.closest('.tile');
        if (tile) {
            const x = parseInt(tile.dataset.x);
            const y = parseInt(tile.dataset.y);
            handleTileRightClick(x, y);
        }
        return false;
    });

    let isPanning = false;
    let startX, startY, scrollLeft, scrollTop;

    const mapContainer = document.getElementById('map-container');

    mapContainer.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
            e.preventDefault();
            isPanning = true;
            mapContainer.classList.add('dragging');
            startX = e.pageX - mapContainer.offsetLeft;
            startY = e.pageY - mapContainer.offsetTop;
            scrollLeft = mapContainer.scrollLeft;
            scrollTop = mapContainer.scrollTop;
        }
    });

    mapContainer.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - mapContainer.offsetLeft;
        const y = e.pageY - mapContainer.offsetTop;
        const walkX = (x - startX) * 1;
        const walkY = (y - startY) * 1;
        mapContainer.scrollLeft = scrollLeft - walkX;
        mapContainer.scrollTop = scrollTop - walkY;
    });

    mapContainer.addEventListener('mouseup', () => {
        isPanning = false;
        mapContainer.classList.remove('dragging');
    });

    mapContainer.addEventListener('mouseleave', () => {
        isPanning = false;
        mapContainer.classList.remove('dragging');
    });

    // Add throttled renderMap call on scroll
    let renderTimeout = null;
    mapContainer.addEventListener('scroll', () => {
        if (!renderTimeout) {
            renderTimeout = setTimeout(() => {
                renderMap();
                renderTimeout = null;
            }, 100);
        }
    });
}

function logMessage(message, playerId = null, otherPlayerId = null) {
    const currentPlayer = gameState.players[gameState.currentPlayer];

    if (playerId !== null && playerId !== currentPlayer.id) {
        const relationWithPlayer = currentPlayer.relations[playerId];
        if (!relationWithPlayer || !relationWithPlayer.hasMet) {
            return;
        }
    }

    if (otherPlayerId !== null && otherPlayerId !== currentPlayer.id) {
        const relationWithOtherPlayer = currentPlayer.relations[otherPlayerId];
        if (!relationWithOtherPlayer || !relationWithOtherPlayer.hasMet) {
            return;
        }
    }

    const logContent = document.getElementById('log-content');
    const logEntry = document.createElement('div');

    if (playerId !== null) {
        const player = gameState.players[playerId];
        logEntry.style.color = getPlayerColor(player.color);
    }

    logEntry.textContent = message;
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

function getPlayerColor(colorClass) {
    const colors = {
        player1: '#e60000',
        player2: '#0047ab',
        player3: '#ff8c00',
        player4: '#9932cc'
    };
    return colors[colorClass] || '#000000';
}

// Create the game map (unchanged)
function createMap() {
    const width = 70;
    const height = 70;

    const heightMap = generateNoiseMap(width, height, 0.1);
    const temperatureMap = generateNoiseMap(width, height, 0.07);
    const humidityMap = generateNoiseMap(width, height, 0.2);

    const smoothedHeightMap = smoothMap(heightMap, width, height);

    for (let y = 0; y < height; y++) {
        gameState.map[y] = [];
        for (let x = 0; x < width; x++) {
            const heightValue = smoothedHeightMap[y][x];
            const temperatureValue = temperatureMap[y][x];
            const humidityValue = humidityMap[y][x];

            let tileType;
            if (heightValue < 0.34) {
                tileType = TILE_TYPES.OCEAN;
            } else if (heightValue < 0.4) {
                tileType = TILE_TYPES.COAST;
            } else if ((heightValue > 0.72 || temperatureValue < 0.25) && heightValue > 0.46 && humidityValue < 0.6) {
                tileType = TILE_TYPES.SNOW;
            } else if (heightValue > 0.65) {
                tileType = TILE_TYPES.MOUNTAINS;
                if (humidityValue > 0.65) {
                    tileType = TILE_TYPES.FOREST;
                }
            } else if (temperatureValue > 0.7 && humidityValue < 0.5 || heightValue < 0.44) {
                tileType = TILE_TYPES.DESERT;
            } else if (humidityValue > 0.65) {
                tileType = TILE_TYPES.FOREST;
            } else if (temperatureValue > 0.5) {
                tileType = TILE_TYPES.PLAINS;
            } else {
                tileType = TILE_TYPES.GRASSLAND;
            }

            gameState.map[y][x] = { ...tileType, x, y };
        }
    }
}

function generateNoiseMap(width, height, scale) {
    const map = [];
    for (let y = 0; y < height; y++) {
        map[y] = [];
        for (let x = 0; x < width; x++) {
            map[y][x] = noise(x, y, scale);
        }
    }
    return map;
}

function smoothMap(map, width, height) {
    const smoothedMap = [];
    for (let y = 0; y < height; y++) {
        smoothedMap[y] = [];
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let count = 0;

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        sum += map[ny][nx];
                        count++;
                    }
                }
            }

            smoothedMap[y][x] = sum / count;
        }
    }
    return smoothedMap;
}

function noise(x, y, scale) {
    return (Perlin.noise(x * scale, y * scale) + 1) / 2;
}

// Create players (unchanged)
function createPlayers() {
    gameState.players = [
        {
            id: 0,
            name: 'Player',
            gold: 50,
            research: 0,
            currentResearch: null,
            researchedTechs: new Set(),
            cities: [],
            units: [],
            color: 'player1',
            isHuman: true,
            relations: {},
            exploredTiles: new Set(),
            buildings: [] // Array to store player's buildings
        }
    ];

    const aiColors = ['player2', 'player3', 'player4'];
    const aiNames = ['Rome', 'Greece', 'Egypt'];

    for (let i = 0; i < 3; i++) {
        gameState.players.push({
            id: i + 1,
            name: aiNames[i],
            gold: 50,
            research: 0,
            currentResearch: null,
            researchedTechs: new Set(),
            cities: [],
            units: [],
            color: aiColors[i],
            isHuman: false,
            relations: {},
            exploredTiles: new Set(),
            buildings: [] // Array to store AI's buildings
        });
    }

    for (const player of gameState.players) {
        for (const otherPlayer of gameState.players) {
            if (player.id !== otherPlayer.id) {
                player.relations[otherPlayer.id] = {
                    attitude: Math.floor(Math.random() * 20) + 40,
                    hasMet: false
                };
            }
        }
    }
}

// Place players on the map (unchanged)
function placePlayers() {
    const landTiles = [];

    // Collect all valid land tiles
    for (let y = 0; y < gameState.map.length; y++) {
        for (let x = 0; x < gameState.map[y].length; x++) {
            const tile = gameState.map[y][x];
            if (tile.name !== 'Ocean' && tile.name !== 'Coast') {
                landTiles.push({ x, y });
            }
        }
    }

    // Shuffle the land tiles to randomize placement
    for (let i = landTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [landTiles[i], landTiles[j]] = [landTiles[j], landTiles[i]];
    }

    // Place a city and a settler for each player
    for (const player of gameState.players) {
        if (landTiles.length === 0) break;

        // Place the city
        const cityTile = landTiles.pop();
        const cityName = generateCityName(player);
        const city = {
            name: cityName,
            x: cityTile.x,
            y: cityTile.y,
            player: player.id,
            production: 0,
            currentProduction: null,
            buildings: [],
            health: 100,
            food: calculateCityFood(cityTile.x, cityTile.y, player.id)
        };
        player.cities.push(city);

        // Place the settler next to the city
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 1, dy: 0 },  // Right
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }, // Left
            { dx: -1, dy: -1 }, // Top-left
            { dx: 1, dy: -1 },  // Top-right
            { dx: -1, dy: 1 },  // Bottom-left
            { dx: 1, dy: 1 }    // Bottom-right
        ];

        let settlerTile = null;
        for (const dir of directions) {
            const nx = cityTile.x + dir.dx;
            const ny = cityTile.y + dir.dy;

            // Check if the tile is valid and available
            if (
                ny >= 0 && ny < gameState.map.length &&
                nx >= 0 && nx < gameState.map[0].length &&
                !findCityAt(nx, ny) &&
                !findUnitAt(nx, ny) &&
                gameState.map[ny][nx].name !== 'Ocean' &&
                gameState.map[ny][nx].name !== 'Coast'
            ) {
                settlerTile = { x: nx, y: ny };
                break;
            }
        }

        // If no adjacent tile is available, fall back to a random land tile
        if (!settlerTile && landTiles.length > 0) {
            settlerTile = landTiles.pop();
        }

        // Place the settler
        if (settlerTile) {
            const settler = {
                id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'SETTLER',
                x: settlerTile.x,
                y: settlerTile.y,
                moves: UNIT_TYPES.SETTLER.move,
                remainingMoves: 0,
                player: player.id,
                hasAttacked: false
            };
            player.units.push(settler);
        }
    }
}

function cleanupCityReferences(city) {
    // Remove any production references
    for (const player of gameState.players) {
        player.units = player.units.filter(unit => 
            !(unit.targetX === city.x && unit.targetY === city.y)
        );
        
        // Clear any unit destinations targeting this city
        for (const unitId in gameState.unitDestinations) {
            const dest = gameState.unitDestinations[unitId];
            if (dest.targetX === city.x && dest.targetY === city.y) {
                delete gameState.unitDestinations[unitId];
            }
        }
    }
}

// Optimized renderMap function with building system
function renderMap() {
    if (!gameState.mapDirty) return;

    const mapElement = document.getElementById('map');

    // Clear ALL dynamic elements (units, cities, buildings, highlights)
    const dynamicElements = mapElement.querySelectorAll('.unit, .city, .building, .construction, .attack-range-overlay');
    dynamicElements.forEach(el => el.remove());

    // Redraw all buildings first
    for (const building of gameState.buildings) {
        const tileElement = document.querySelector(`.tile[data-x="${building.x}"][data-y="${building.y}"]`);
        if (tileElement) {
            if (building.type.endsWith('_CONSTRUCTION')) {
                // Construction site
                const buildingType = building.type.replace('_CONSTRUCTION', '');
                const buildingDef = BUILDING_TYPES[buildingType];
                const buildingElement = document.createElement('div');
                buildingElement.className = `construction ${gameState.players[building.player].color}`;
                buildingElement.textContent = '🚧';
                buildingElement.title = `${buildingDef.name} under construction (${building.turnsRemaining} turns left)`;
                tileElement.appendChild(buildingElement);
            } else {
                // Completed building
                const buildingDef = BUILDING_TYPES[building.type];
                const buildingElement = document.createElement('div');
                buildingElement.className = `building ${gameState.players[building.player].color} ${building.type.toLowerCase()}`;
                buildingElement.textContent = buildingDef.icon;
                buildingElement.title = buildingDef.name;
                tileElement.appendChild(buildingElement);
            }
        }
    }

    // Rest of the renderMap function remains the same...
    // Then redraw all cities
    for (const player of gameState.players) {
        for (const city of player.cities) {
            const tileElement = document.querySelector(`.tile[data-x="${city.x}"][data-y="${city.y}"]`);
            if (tileElement) {
                const cityElement = document.createElement('div');
                cityElement.className = `city ${player.color}`;
                cityElement.textContent = city.name.slice(0, 2);
                cityElement.style.textShadow = '1px 1px 2px black';
                tileElement.appendChild(cityElement);
            }
        }
    }

    // Then redraw all units
    for (const player of gameState.players) {
        for (const unit of player.units) {
            const tileElement = document.querySelector(`.tile[data-x="${unit.x}"][data-y="${unit.y}"]`);
            if (tileElement) {
                const unitElement = document.createElement('div');
                unitElement.className = `unit ${player.color}`;
                unitElement.textContent = unit.type.slice(0, 2);
                if (unit.player === gameState.currentPlayer && unit.moves > 0) {
                    unitElement.style.boxShadow = '0 0 0 2px white';
                }
                tileElement.appendChild(unitElement);
            }
        }
    }

    // Highlight attack ranges
    gameState.highlightedTiles.forEach(({ x, y }) => {
        const tileElement = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
        if (tileElement) {
            tileElement.classList.add('attack-range');
        }
    });

    gameState.mapDirty = false;
}

// Initial map rendering (only called once)
function renderInitialMap() {
    const mapElement = document.getElementById('map');
    mapElement.innerHTML = '';
    
    for (let y = 0; y < gameState.map.length; y++) {
        for (let x = 0; x < gameState.map[y].length; x++) {
            const tile = gameState.map[y][x];
            const tileElement = document.createElement('div');
            tileElement.className = `tile ${tile.color}`;
            tileElement.dataset.x = x;
            tileElement.dataset.y = y;

            // Add event listeners
            tileElement.addEventListener('mouseenter', (e) => showTileInfo(tile, e));
            tileElement.addEventListener('mousemove', (e) => moveTileInfo(e));
            tileElement.addEventListener('mouseleave', hideTileInfo);
            tileElement.addEventListener('click', () => handleTileClick(x, y));

            mapElement.appendChild(tileElement);
        }
    }
    
    // Now render the dynamic elements (units, cities, buildings)
    gameState.mapDirty = true;
    renderMap();
}

// Show tile information
function showTileInfo(tile, event) {
    const tileInfo = document.getElementById('tile-info');
    let infoHTML = `
        <strong>${tile.name}</strong><br>
        Move Cost: ${tile.moveCost}<br>
        Food: ${tile.food}<br>
        Production: ${tile.production}<br>
        Gold: ${tile.gold}
    `;

    // Check for city
    const city = findCityAt(tile.x, tile.y);
    if (city) {
        const cityPlayer = gameState.players[city.player];
        infoHTML += `<br><strong>City:</strong> ${city.name} (${cityPlayer.name})`;
    }

    // Check for unit
    const unit = findUnitAt(tile.x, tile.y);
    if (unit) {
        const unitPlayer = gameState.players[unit.player];
        infoHTML += `<br><strong>Unit:</strong> ${UNIT_TYPES[unit.type].name} (${unitPlayer.name})`;
    }

    // Check for building
    const building = findBuildingAt(tile.x, tile.y);
    if (building) {
        const buildingPlayer = gameState.players[building.player];
        const buildingDef = BUILDING_TYPES[building.type];
        if (buildingDef) {
            infoHTML += `<br><strong>Building:</strong> ${buildingDef.name} (${buildingPlayer.name})`;
        }
    }

    tileInfo.innerHTML = infoHTML;
    tileInfo.style.display = 'block';
    moveTileInfo(event);
}

// Move the tile information popup with the mouse
function moveTileInfo(event) {
    const tileInfo = document.getElementById('tile-info');
    tileInfo.style.left = `${event.pageX + 10}px`;
    tileInfo.style.top = `${event.pageY + 10}px`;
}

// Hide tile information
function hideTileInfo() {
    const tileInfo = document.getElementById('tile-info');
    tileInfo.style.display = 'none';
}

// Handle tile clicks
function handleTileClick(x, y) {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const city = findCityAt(x, y);

    // Check if we're placing a building
    if (gameState.buildingConstruction) {
        const { cityX, cityY, playerId, buildingType } = gameState.buildingConstruction;
        const player = gameState.players[playerId];
        
        // Check if clicked tile is adjacent and highlighted
        const isAdjacent = (Math.abs(x - cityX) + Math.abs(y - cityY)) === 1;
        const isHighlighted = gameState.highlightedTiles.some(t => t.x === x && t.y === y);
        
        if (isAdjacent && isHighlighted) {
            if (buildBuilding(player, buildingType, x, y)) {
                // Clear highlights
                gameState.highlightedTiles.forEach(t => {
                    const tileElement = document.querySelector(`.tile[data-x="${t.x}"][data-y="${t.y}"]`);
                    if (tileElement) tileElement.classList.remove('buildable');
                });
                gameState.highlightedTiles = [];
                delete gameState.buildingConstruction;
            }
        } else {
            alert("Please select one of the highlighted adjacent tiles");
        }
        return;
    }
    
    if (city && city.player === currentPlayer.id) {
        gameState.selectedCity = city;
        gameState.selectedUnit = null;
        clearAttackRangeHighlights();
        showCityPanel(city);
        return;
    }

    const unit = findUnitAt(x, y);
    if (unit && unit.player === currentPlayer.id) {
        // Prevent map shifting by focusing on the unit's tile
        const tileElement = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
        if (tileElement) {
            tileElement.focus({ preventScroll: true }); // Prevent auto-scrolling
        }

        if (unit.type === 'SETTLER') {
            const tile = gameState.map[y][x];
            if (tile.name !== 'Ocean' && tile.name !== 'Coast' && !findCityAt(x, y)) {
                const confirmCity = confirm("Do you want to found a city here?");
                if (confirmCity) {
                    foundCity(unit, x, y);
                    return;
                }
            } else {
                alert("You cannot found a city here!");
            }
        }
        
        gameState.selectedUnit = unit;
        gameState.selectedCity = null;
        highlightAttackRange(unit);
    } else {
        gameState.selectedUnit = null;
        gameState.selectedCity = null;
        clearAttackRangeHighlights();
    }

    gameState.mapDirty = true;
    renderMap();
    updateUI();
}

// Check if a unit can move to a tile
function canMoveTo(unit, x, y, ignoreUnits = false) {
    // Check if the coordinates are out of bounds
    if (y < 0 || y >= gameState.map.length || x < 0 || x >= gameState.map[0].length) {
        return false;
    }

    const tile = gameState.map[y][x];
    const unitType = UNIT_TYPES[unit.type];

    // Check if the unit is naval
    if (unitType.naval) {
        // Naval units can only move to Ocean or Coast tiles
        return tile.name === 'Ocean' || tile.name === 'Coast';
    } else {
        // Non-naval units cannot move to Ocean or Coast tiles
        if (tile.name === 'Ocean' || tile.name === 'Coast') {
            return false;
        }
    }

    // Check if there's a building on this tile (can't move onto buildings)
    const building = findBuildingAt(x, y);
    if (building && building.player !== unit.player) {
        return false;
    }

    // If ignoring units, skip the unit check
    if (ignoreUnits) {
        return true;
    }

    // Check if another unit is already on the tile
    const otherUnit = findUnitAt(x, y);
    if (otherUnit) {
        // Prevent moving onto any friendly unit's tile
        if (otherUnit.player === unit.player) {
            return false;
        }
        // Only allow movement if attacking an enemy
        return canAttack(unit, otherUnit);
    }

    return true; // Tile is valid for movement
}

// Check if a unit can attack another unit or a city or a building
function canAttack(attacker, target) {
    if (attacker.type === 'SETTLER') return false;

    const attackerType = UNIT_TYPES[attacker.type];

    // Check if target is a city
    if (target.health !== undefined && !target.type) {  // Cities have health but no type
        return !attackerType.naval;
    }

    // Check if target is a building
    if (target.type && BUILDING_TYPES[target.type]) {
        return true;  // All non-settler units can attack buildings
    }

    // Otherwise, target is a unit
    const defenderType = UNIT_TYPES[target.type];
    if (attackerType.naval && !defenderType.naval) return false;

    return true;
}

function moveUnit(unit, x, y) {
    clearAttackRangeHighlights();

    const tile = gameState.map[y][x];

    if (unit.remainingMoves > 0) {
        unit.remainingMoves--;
        if (unit.remainingMoves === 0) {
            unit.x = unit.targetX;
            unit.y = unit.targetY;
        }
        return;
    }

    if (unit.moves < tile.moveCost) {
        unit.remainingMoves = tile.moveCost - unit.moves + 2;
        unit.moves = 0;
        unit.targetX = x;
        unit.targetY = y;
        return;
    }

    const otherUnit = findUnitAt(x, y);
    if (otherUnit && otherUnit.player !== unit.player) {
        const attackerPlayer = gameState.players[unit.player];
        const defenderPlayer = gameState.players[otherUnit.player];
        attackerPlayer.relations[defenderPlayer.id].hasMet = true;
        defenderPlayer.relations[attackerPlayer.id].hasMet = true;
        performRangedAttack(unit, x, y);
        return;
    }

    const city = findCityAt(x, y);
    if (city && city.player !== unit.player) {
        const attackerPlayer = gameState.players[unit.player];
        const cityPlayer = gameState.players[city.player];
        attackerPlayer.relations[cityPlayer.id].hasMet = true;
        cityPlayer.relations[attackerPlayer.id].hasMet = true;
        performRangedAttack(unit, x, y);
        return;
    }

    const building = findBuildingAt(x, y);
    if (building && building.player !== unit.player) {
        const attackerPlayer = gameState.players[unit.player];
        const buildingPlayer = gameState.players[building.player];
        attackerPlayer.relations[buildingPlayer.id].hasMet = true;
        buildingPlayer.relations[attackerPlayer.id].hasMet = true;
        attackBuilding(unit, building);
        return;
    }

    unit.x = x;
    unit.y = y;
    unit.moves -= tile.moveCost;

    gameState.mapDirty = true;
    renderMap();
}

function processQueuedMoves() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (!currentPlayer.isHuman) return;
    
    Object.keys(gameState.unitDestinations).forEach(unitId => {
        const unit = currentPlayer.units.find(u => u.id === unitId);
        if (!unit || unit.moves <= 0) return;
        
        const destination = gameState.unitDestinations[unitId];
        const newPath = findPath(unit.x, unit.y, destination.targetX, destination.targetY, unit);
        if (newPath.length === 0) {
            delete gameState.unitDestinations[unitId];
            return;
        }
        
        const nextStep = newPath[0];
        if (canMoveTo(unit, nextStep.x, nextStep.y)) {
            moveUnit(unit, nextStep.x, nextStep.y);
        } else {
            delete gameState.unitDestinations[unitId];
        }
    });
}

function performRangedAttack(attacker, targetX, targetY) {
    const attackerType = UNIT_TYPES[attacker.type];
    if (!attackerType.range) return;

    const dx = Math.abs(attacker.x - targetX);
    const dy = Math.abs(attacker.y - targetY);

    // Ensure the target is within range and only orthogonal
    if ((dx !== 0 && dy !== 0) || dx + dy > attackerType.range) {
        logMessage(`${attacker.type} cannot attack target at (${targetX}, ${targetY}) because it is out of range or not orthogonal.`, attacker.player);
        return;
    }

    const targetUnit = findUnitAt(targetX, targetY);
    const targetCity = findCityAt(targetX, targetY);
    const targetBuilding = findBuildingAt(targetX, targetY);

    if (targetUnit && targetUnit.player !== attacker.player) {
        resolveRangedCombat(attacker, targetUnit);
    } else if (targetCity && targetCity.player !== attacker.player) {
        resolveRangedCombat(attacker, targetCity);
    } else if (targetBuilding && targetBuilding.player !== attacker.player) {
        attackBuilding(attacker, targetBuilding);
    } else {
        logMessage(`${attacker.type} has no valid target at (${targetX}, ${targetY}).`, attacker.player);
    }
}

function resolveRangedCombat(attacker, target) {
    const attackerType = UNIT_TYPES[attacker.type];
    const attackerPlayer = gameState.players[attacker.player];

    if (attackerType === 'SETTLER') {
        return;
    }

    if (attacker.hasAttacked) {
        logMessage(`${attacker.type} has already attacked this turn.`, attacker.player);
        return;
    }

    if (target.health !== undefined) {
        // Target is a city
        const city = target;
        const cityPlayer = gameState.players[city.player];

        const damage = attackerType.strength * (1 + Math.random() * 0.2);
        city.health -= damage;

        attackerPlayer.relations[cityPlayer.id].hasMet = true;
        cityPlayer.relations[attackerPlayer.id].hasMet = true;

        attackerPlayer.relations[cityPlayer.id].attitude = Math.max(0, attackerPlayer.relations[cityPlayer.id].attitude - 10);
        cityPlayer.relations[attackerPlayer.id].attitude = Math.max(0, cityPlayer.relations[attackerPlayer.id].attitude - 10);

        logMessage(`${attackerPlayer.name}'s ${attacker.type} dealt ${Math.round(damage)} damage to ${city.name}.`, attacker.player, city.player);

        // Check if allies come to help
        for (const ally of gameState.players) {
            if (ally.id !== cityPlayer.id && ally.relations[cityPlayer.id]?.attitude >= 80) {
                if (ally.id !== attackerPlayer.id) {
                    ally.relations[attacker.player] = ally.relations[attacker.player] || { attitude: 50, hasMet: true };
                    ally.relations[attacker.player].attitude = Math.max(0, ally.relations[attacker.player].attitude - 40);

                    logMessage(`${ally.name} has come to the aid of ${cityPlayer.name} and is now hostile toward ${attackerPlayer.name}!`, ally.id, attacker.player);
                }
            }
        }

        if (city.health <= 0) {
            logMessage(`${city.name} has been defeated!`, attacker.player, city.player);
            captureOrDestroyCity(attackerPlayer, cityPlayer, city);
        }
    } else {
        // Target is a unit
        const defender = target;
        const defenderPlayer = gameState.players[defender.player];

        const damage = attackerType.strength * (1 + Math.random() * 0.2);
        defenderPlayer.units = defenderPlayer.units.filter(u => u !== defender);

        attackerPlayer.relations[defender.player].hasMet = true;
        defenderPlayer.relations[attacker.player].hasMet = true;

        defenderPlayer.relations[attacker.player].attitude = Math.max(0, defenderPlayer.relations[attacker.player].attitude - 10);
        attackerPlayer.relations[defender.player].attitude = Math.max(0, attackerPlayer.relations[defender.player].attitude - 10);

        logMessage(`${attackerPlayer.name}'s ${attacker.type} defeated ${defenderPlayer.name}'s ${defender.type}.`, attacker.player, defender.player);

        // Check if allies come to help
        for (const ally of gameState.players) {
            if (ally.id !== defenderPlayer.id && ally.relations[defenderPlayer.id]?.attitude >= 80) {
                if (ally.id !== attackerPlayer.id) {
                    ally.relations[attacker.player] = ally.relations[attacker.player] || { attitude: 50, hasMet: true };
                    ally.relations[attacker.player].attitude = Math.max(0, ally.relations[attacker.player].attitude - 40);

                    logMessage(`${ally.name} has come to the aid of ${defenderPlayer.name} and is now hostile toward ${attackerPlayer.name}!`, ally.id, attacker.player);
                }
            }
        }
    }

    attacker.hasAttacked = true;
}

function attackBuilding(attacker, building) {
    const attackerType = UNIT_TYPES[attacker.type];
    const attackerPlayer = gameState.players[attacker.player];
    const buildingPlayer = gameState.players[building.player];

    if (attacker.hasAttacked) {
        logMessage(`${attacker.type} has already attacked this turn.`, attacker.player);
        return;
    }

    const buildingDef = BUILDING_TYPES[building.type];
    const damage = attackerType.strength * (1 + Math.random() * 0.2);
    building.health -= damage;

    attackerPlayer.relations[buildingPlayer.id].hasMet = true;
    buildingPlayer.relations[attackerPlayer.id].hasMet = true;

    attackerPlayer.relations[buildingPlayer.id].attitude = Math.max(0, attackerPlayer.relations[buildingPlayer.id].attitude - 5);
    buildingPlayer.relations[attackerPlayer.id].attitude = Math.max(0, buildingPlayer.relations[attackerPlayer.id].attitude - 5);

    logMessage(`${attackerPlayer.name}'s ${attacker.type} dealt ${Math.round(damage)} damage to ${buildingDef.name}.`, attacker.player, building.player);

    if (building.health <= 0) {
        destroyBuilding(building);
        logMessage(`${attackerPlayer.name} has destroyed the ${buildingDef.name}!`, attacker.player, building.player);
    }

    attacker.hasAttacked = true;
    gameState.mapDirty = true;
    renderMap();
}

function destroyBuilding(building) {
    // Remove the building from the game state
    gameState.buildings = gameState.buildings.filter(b => b !== building);
    
    // Also remove it from the player's buildings array if it exists there
    const player = gameState.players[building.player];
    if (player.buildings) {
        player.buildings = player.buildings.filter(b => b !== building);
    }
    
    gameState.mapDirty = true;
}

function highlightAttackRange(unit) {
    const unitType = UNIT_TYPES[unit.type];
    if (!unitType.range) return;

    clearAttackRangeHighlights(); // Clear any existing highlights first
    gameState.highlightedTiles = []; // Reset the array

    const range = unitType.range;
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 1, dy: 0 },  // Right
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }  // Left
    ];

    for (const dir of directions) {
        for (let i = 1; i <= range; i++) {
            const nx = unit.x + dir.dx * i;
            const ny = unit.y + dir.dy * i;

            // Check bounds
            if (ny < 0 || ny >= gameState.map.length || nx < 0 || nx >= gameState.map[0].length) {
                continue;
            }

            // Get the tile element carefully
            const tileElement = document.querySelector(`.tile[data-x="${nx}"][data-y="${ny}"]`);
            if (tileElement) {
                // Create a highlight overlay instead of modifying the tile directly
                const highlight = document.createElement('div');
                highlight.className = 'attack-range-overlay';
                highlight.style.position = 'absolute';
                highlight.style.width = '100%';
                highlight.style.height = '100%';
                highlight.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                highlight.style.pointerEvents = 'none';
                highlight.style.zIndex = '2';
                
                tileElement.appendChild(highlight);
                gameState.highlightedTiles.push({ x: nx, y: ny, element: highlight });
            }
        }
    }
}

function clearAttackRangeHighlights() {
    // Remove all highlight overlays
    const highlights = document.querySelectorAll('.attack-range-overlay');
    highlights.forEach(highlight => {
        if (highlight.parentNode) {
            highlight.parentNode.removeChild(highlight);
        }
    });
    
    // Clear the stored highlights
    gameState.highlightedTiles = [];
    
    // Also remove any lingering attack-range classes (legacy cleanup)
    const legacyHighlights = document.querySelectorAll('.tile.attack-range');
    legacyHighlights.forEach(tile => {
        tile.classList.remove('attack-range');
    });
}

function captureOrDestroyCity(attackerPlayer, cityPlayer, city) {
    if (attackerPlayer.isHuman) {
        const choice = confirm(`Do you want to capture ${city.name}? Click "OK" to capture or "Cancel" to destroy.`);
        
        if (choice) {
            // Capture the city
            city.player = attackerPlayer.id;
            city.health = 100;
            attackerPlayer.cities.push(city);
            cityPlayer.cities = cityPlayer.cities.filter(c => c !== city);
            logMessage(`${attackerPlayer.name} has captured ${city.name}!`, attackerPlayer.id, cityPlayer.id);
        } else {
            // Destroy the city
            cityPlayer.cities = cityPlayer.cities.filter(c => c !== city);
            const goldReward = Math.floor(Math.random() * 20) + 10; // Random gold reward between 10 and 30
            attackerPlayer.gold += goldReward;
            logMessage(`${attackerPlayer.name} has destroyed ${city.name} and gained ${goldReward} gold!`, attackerPlayer.id, cityPlayer.id);
        }
    } else {
        // AI logic
        const shouldCapture = Math.random() > 0.3;
        
        if (shouldCapture) {
            city.player = attackerPlayer.id;
            city.health = 100;
            attackerPlayer.cities.push(city);
            cityPlayer.cities = cityPlayer.cities.filter(c => c !== city);
            logMessage(`${attackerPlayer.name} has captured ${city.name}!`, attackerPlayer.id, cityPlayer.id);
        } else {
            cityPlayer.cities = cityPlayer.cities.filter(c => c !== city);
            const goldReward = Math.floor(Math.random() * 20) + 10; // Random gold reward between 10 and 30
            attackerPlayer.gold += goldReward;
            logMessage(`${attackerPlayer.name} has destroyed ${city.name} and gained ${goldReward} gold!`, attackerPlayer.id, cityPlayer.id);
        }
    }

    // Force immediate map update
    gameState.mapDirty = true;
    cleanupCityReferences(city);
    renderMap();
    updateUI();
    
    // Clear any selection that might reference the city
    if (gameState.selectedCity && (gameState.selectedCity.x === city.x && gameState.selectedCity.y === city.y)) {
        gameState.selectedCity = null;
        hideCityPanel();
    }
}

// Found a new city
function foundCity(unit, x, y) {
    const player = gameState.players[unit.player];
    const cityName = generateCityName(player);

    const city = {
        name: cityName,
        x,
        y,
        player: player.id,
        production: 0,
        currentProduction: null,
        buildings: [],
        health: 100,
        food: calculateCityFood(x, y, player.id)
    };

    player.cities.push(city);
    player.units = player.units.filter(u => u !== unit);

    logMessage(`${player.name} founded the city of ${city.name}!`, player.id);

    gameState.mapDirty = true;
    renderMap();
    updateUI();
}

function calculateUnitCap(player) {
    const unitsPerCity = 5;
    return player.cities.length * unitsPerCity;
}

function calculateCityFood(x, y, playerId) {
    let food = 2; // Base food value for the city itself
    const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;

        if (ny >= 0 && ny < gameState.map.length && nx >= 0 && nx < gameState.map[0].length) {
            const tile = gameState.map[ny][nx];
            food += tile.food || 0;
        }
    }

    // Add food from nearby buildings
    for (const building of gameState.buildings) {
        if (building.player === playerId) {
            const buildingDef = BUILDING_TYPES[building.type];
            if (buildingDef && buildingDef.effects && buildingDef.effects.food) {
                const distance = Math.abs(building.x - x) + Math.abs(building.y - y);
                if (distance <= 2) { // Buildings affect cities within 2 tiles
                    food += buildingDef.effects.food;
                }
            }
        }
    }

    return food;
}

function calculateCityProduction(x, y) {
    let production = 0;
    const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;

        if (ny >= 0 && ny < gameState.map.length && nx >= 0 && nx < gameState.map[0].length) {
            const tile = gameState.map[ny][nx];
            production += tile.production || 0;
        }
    }

    return production;
}

function calculateCityGold(x, y) {
    let gold = 0;
    const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;

        if (ny >= 0 && ny < gameState.map.length && nx >= 0 && nx < gameState.map[0].length) {
            const tile = gameState.map[ny][nx];
            gold += tile.gold;
        }
    }

    return gold;
}

function calculateCityResearch(x, y, playerId) {
    let research = 2; // Base research value for the city
    const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;

        if (ny >= 0 && ny < gameState.map.length && nx >= 0 && nx < gameState.map[0].length) {
            const tile = gameState.map[ny][nx];
            research += tile.research || 0;
        }
    }

    // Add research boost from nearby libraries
    for (const building of gameState.buildings) {
        if (building.player === playerId) {
            const buildingDef = BUILDING_TYPES[building.type];
            if (buildingDef && buildingDef.effects && buildingDef.effects.researchMultiplier) {
                const distance = Math.abs(building.x - x) + Math.abs(building.y - y);
                if (distance <= 2) { // Libraries affect cities within 2 tiles
                    research *= buildingDef.effects.researchMultiplier;
                }
            }
        }
    }

    return Math.floor(research); // Return the total research value
}

function generateCityName(player) {
    const prefixes = {
        0: ['New', 'Fort', 'Port', 'San', 'Los'],
        1: ['Roma', 'Ven', 'Flor', 'Gen', 'Pis'],
        2: ['Athe', 'Spar', 'Cor', 'Del', 'Thes'],
        3: ['Mem', 'Alex', 'Theb', 'Cai', 'Giz']
    };
    
    const suffixes = {
        0: ['ville', 'burg', 'ton', ' City', ' Springs'],
        1: ['a', 'ice', 'enza', 'ona', 'ento'],
        2: ['ns', 'ta', 'os', 'ia', 'alon'],
        3: ['phis', 'andria', 'es', 'ro', 'ah']
    };
    
    const prefixList = prefixes[player.id] || prefixes[0];
    const suffixList = suffixes[player.id] || suffixes[0];
    
    const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
    const suffix = suffixList[Math.floor(Math.random() * suffixList.length)];
    
    return prefix + suffix;
}

function findUnitAt(x, y) {
    for (const player of gameState.players) {
        const unit = player.units.find(u => u.x === x && u.y === y);
        if (unit) return unit;
    }
    return null;
}

function findCityAt(x, y) {
    for (const player of gameState.players) {
        const city = player.cities.find(c => c.x === x && c.y === y);
        if (city) return city;
    }
    return null;
}

function findBuildingAt(x, y) {
    return gameState.buildings.find(b => b.x === x && b.y === y);
}

// Generic building functions
function canBuildBuilding(player, buildingType, x, y) {
    const buildingDef = BUILDING_TYPES[buildingType];
    if (!buildingDef) return false;

    // Check if player has researched required technology
    if (buildingDef.requires && !player.researchedTechs.has(buildingDef.requires)) {
        return false;
    }

    // Check if player has enough gold
    if (player.gold < buildingDef.goldCost) {
        return false;
    }

    // Check if tile is adjacent to one of the player's cities
    const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
    ];

    for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;

        if (ny >= 0 && ny < gameState.map.length && nx >= 0 && nx < gameState.map[0].length) {
            const city = findCityAt(nx, ny);
            if (city && city.player === player.id) {
                // Check if the city already has a library
                const hasLibrary = gameState.buildings.some(b => 
                    b.type === 'LIBRARY' && b.player === player.id && 
                    Math.abs(b.x - city.x) + Math.abs(b.y - city.y) <= 1
                );
                if (buildingType === 'LIBRARY' && hasLibrary) {
                    return false; // Prevent building another library for this city
                }
                return true;
            }
        }
    }

    return false;
}

function buildBuilding(player, buildingType, x, y) {
    if (!canBuildBuilding(player, buildingType, x, y)) {
        alert("Cannot build here!");
        return false;
    }

    const buildingDef = BUILDING_TYPES[buildingType];
    
    // Deduct gold immediately
    player.gold -= buildingDef.goldCost;
    
    // Create construction site with _CONSTRUCTION suffix
    const construction = {
        type: `${buildingType}_CONSTRUCTION`,  // Note the _CONSTRUCTION suffix
        x: x,
        y: y,
        player: player.id,
        progress: 0,
        totalProgress: buildingDef.productionCost,
        turnsRemaining: buildingDef.constructionTurns || 4
    };

    gameState.buildings.push(construction);
    logMessage(`${player.name} started building a ${buildingDef.name} at (${x}, ${y}). Will complete in ${construction.turnsRemaining} turns.`, player.id);
    
    gameState.mapDirty = true;
    renderMap();
    updateUI();
    return true;
}

function completeBuilding(construction) {
    const buildingType = construction.type.replace('_CONSTRUCTION', '');
    const buildingDef = BUILDING_TYPES[buildingType];
    const player = gameState.players[construction.player];
    
    // Remove the construction site
    gameState.buildings = gameState.buildings.filter(b => b !== construction);
    
    // Add the completed building
    const building = {
        type: buildingType,
        x: construction.x,
        y: construction.y,
        player: construction.player,
        health: buildingDef.health || 50
    };
    
    gameState.buildings.push(building);
    player.buildings.push(building);
    
    logMessage(`${player.name} has completed a ${buildingDef.name} at (${building.x}, ${building.y})!`, player.id);
    
    // Force immediate re-render
    gameState.mapDirty = true;
}

function aiTradeWithPlayer(aiPlayer) {
    const humanPlayer = gameState.players[0];
    const relation = aiPlayer.relations[humanPlayer.id];

    // Ensure the AI has researched "Writing"
    if (!aiPlayer.researchedTechs.has('WRITING')) {
        return;
    }

    if (relation.tradedThisTurn) return;

    const tradeDistance = 7;
    const canTrade = aiPlayer.cities.some(aiCity =>
        humanPlayer.cities.some(humanCity =>
            Math.abs(aiCity.x - humanCity.x) + Math.abs(aiCity.y - humanCity.y) <= tradeDistance
        )
    );

    if (!canTrade) return;

    const goldOffered = Math.floor(Math.random() * 20) + 10;
    if (aiPlayer.gold < goldOffered) return;

    const tradeChance = relation.attitude / 100;
    if (Math.random() > tradeChance) return;

    const reputationBoost = Math.floor(Math.random() * 5) + 5;

    const acceptTrade = confirm(`${aiPlayer.name} offers you ${goldOffered} gold in exchange for improving relations by ${reputationBoost} points. Do you accept?`);

    aiPlayer.relations[humanPlayer.id].hasMet = true;
    humanPlayer.relations[aiPlayer.id].hasMet = true;

    if (acceptTrade) {
        humanPlayer.gold += goldOffered;
        aiPlayer.gold -= goldOffered;
        aiPlayer.relations[humanPlayer.id].attitude = Math.min(100, relation.attitude + reputationBoost);
        humanPlayer.relations[aiPlayer.id].attitude = Math.min(100, humanPlayer.relations[aiPlayer.id].attitude + reputationBoost);

logMessage(`${humanPlayer.name} accepted a trade with ${aiPlayer.name}. Relations improved!`, aiPlayer.id, humanPlayer.id);
} else {
logMessage(`${humanPlayer.name} declined a trade offer from ${aiPlayer.name}.`, aiPlayer.id, humanPlayer.id);
humanPlayer.relations[aiPlayer.id].attitude = Math.min(100, relation.attitude - 2);
aiPlayer.relations[humanPlayer.id].attitude = Math.min(100, aiPlayer.relations[humanPlayer.id].attitude - 2);
}

relation.tradedThisTurn = true;
}

function resetTradeFlags() {
    for (const player of gameState.players) {
        for (const relation of Object.values(player.relations)) {
            relation.tradedThisTurn = false;
        }
    }
}

function evaluateTileScore(x, y, aiPlayer) {
    let score = 0;
    const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;

        if (ny >= 0 && ny < gameState.map.length && nx >= 0 && nx < gameState.map[0].length) {
            const tile = gameState.map[ny][nx];
            if (!findCityAt(nx, ny)) {
                score += (tile.food || 0) + (tile.production || 0) + (tile.gold * 3 || 0);
            }
        }
    }

    let nearestDistance = Infinity;
    for (const city of aiPlayer.cities) {
        const distance = Math.abs(city.x - x) + Math.abs(city.y - y);
        nearestDistance = Math.min(nearestDistance, distance);
    }
    for (const unit of aiPlayer.units) {
        const distance = Math.abs(unit.x - x) + Math.abs(unit.y - y);
        nearestDistance = Math.min(nearestDistance, distance);
    }

    const distancePenalty = nearestDistance > 13 ? -Infinity : -nearestDistance * 2;
    score += distancePenalty;

    return score;
}

// End the current player's turn
function endTurn() {
    const endTurnButton = document.getElementById('end-turn-btn');
    endTurnButton.disabled = true;

    const currentPlayer = gameState.players[gameState.currentPlayer];
    processQueuedMoves();
    processPlayerTurn(currentPlayer);

    let nextPlayerIndex = (gameState.currentPlayer + 1) % gameState.players.length;

    const processAITurns = () => {
        if (nextPlayerIndex !== 0) {
            gameState.currentPlayer = nextPlayerIndex;
            const nextPlayer = gameState.players[gameState.currentPlayer];

            if (!nextPlayer.isHuman) {
                aiTurn(nextPlayer);
                processPlayerTurn(nextPlayer);
            }

            nextPlayerIndex = (gameState.currentPlayer + 1) % gameState.players.length;
            setTimeout(processAITurns, 100);
        } else {
            gameState.currentPlayer = 0;
            const humanPlayer = gameState.players[0];
            for (const unit of humanPlayer.units) {
                unit.moves = UNIT_TYPES[unit.type].move;
            }

            gameState.turn++;
            gameState.mapDirty = true;
            renderMap();
            updateUI();
            endTurnButton.disabled = false;
        }
    };

    processAITurns();
}

function isPathValid(path, unit) {
    for (const step of path) {
        if (!canMoveTo(unit, step.x, step.y, true)) {
            return false;
        }
    }
    return true;
}

function processPlayerTurn(player) {
    // Initialize as let instead of const since we'll modify them
    let totalFood = 0;
    let foodConsumption = 0;

    // First calculate base food from cities
    for (const city of player.cities) {
        city.food = calculateCityFood(city.x, city.y, player.id);
        totalFood += city.food;
    }

    // Then calculate consumption from units
    for (const unit of player.units) {
        foodConsumption += UNIT_TYPES[unit.type].foodConsumption;
    }

    // Process unit movement and reset
    for (const unit of player.units) {
        if (unit.remainingMoves > 0) {
            unit.remainingMoves--;
            if (unit.remainingMoves === 0) {
                unit.x = unit.targetX;
                unit.y = unit.targetY;
            }
        } else {
            unit.moves = UNIT_TYPES[unit.type].move;
        }
        unit.hasAttacked = false;
    }

    // Process building construction progress
    for (let i = gameState.buildings.length - 1; i >= 0; i--) {
        const building = gameState.buildings[i];
        if (building.type.endsWith('_CONSTRUCTION') && building.player === player.id) {
            // Get adjacent city production
            const production = getAdjacentCityProduction(building.x, building.y, player.id);
            building.progress += production;
            building.turnsRemaining--;

            if (building.progress >= building.totalProgress || building.turnsRemaining <= 0) {
                completeBuilding(building);
            }
        }
    }

    // Handle food shortage
    if (totalFood < foodConsumption) {
        const deficit = foodConsumption - totalFood;
        logMessage(`${player.name} has a food shortage! ${deficit} units will starve.`, player.id);
        
        const sortedUnits = [...player.units].sort((a, b) => 
            UNIT_TYPES[a.type].strength - UNIT_TYPES[b.type].strength
        );
        
        for (let i = 0; i < deficit && sortedUnits.length > 0; i++) {
            const unitToRemove = sortedUnits.shift();
            player.units = player.units.filter(u => u !== unitToRemove);
            logMessage(`${player.name}'s ${unitToRemove.type} starved to death!`, player.id);
        }
    }

    for (const city of player.cities) {
        player.gold += 1;
        player.gold += calculateCityGold(city.x, city.y);
    }

    for (const city of player.cities) {
        if (city.currentProduction) {
            if (city.production >= 0) {
                city.production += calculateCityProduction(city.x, city.y);
            }
            if (city.production < 0) {
                city.production = 0;
            }
            const unitType = UNIT_TYPES[city.currentProduction];
            if (unitType && city.production >= unitType.cost) {
                const unit = {
                    id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: city.currentProduction,
                    x: city.x,
                    y: city.y,
                    moves: UNIT_TYPES[city.currentProduction].move,
                    remainingMoves: 0,
                    player: player.id,
                    hasAttacked: false
                };

                const directions = [
                    { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
                    { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
                ];
                let placed = false;
                for (const dir of directions) {
                    const nx = city.x + dir.dx;
                    const ny = city.y + dir.dy;
                    if (canMoveTo(unit, nx, ny, true) && !findUnitAt(nx, ny) && !findCityAt(nx, ny)) {
                        unit.x = nx;
                        unit.y = ny;
                        placed = true;
                        break;
                    }
                }

                player.units.push(unit);
                city.production = 0;
                city.currentProduction = null;
            }
        }
    }

    if (player.currentResearch) {
        for (const city of player.cities) {
            player.research += calculateCityResearch(city.x, city.y, player.id);
        }
        const tech = TECH_TREE[player.currentResearch];
        if (player.research >= tech.cost) {
            player.researchedTechs.add(player.currentResearch);
            logMessage(`${player.name} completed research on ${tech.name}.`, player.id);
            player.currentResearch = null;
            player.research = 0;
        }
    }

    if (!player.isHuman) {
        for (const unit of player.units) {
            unit.moves = UNIT_TYPES[unit.type].move;
        }
    }
}

function getAdjacentCityProduction(x, y, playerId) {
    const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
    ];
    
    for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        const city = findCityAt(nx, ny);
        if (city && city.player === playerId) {
            return calculateCityProduction(nx, ny);
        }
    }
    return 0;
}

function findPath(startX, startY, targetX, targetY, unit) {
    const openSet = [
        {
            x: startX,
            y: startY,
            g: 0,
            h: heuristic(startX, startY, targetX, targetY),
            path: []
        }
    ];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    while (openSet.length > 0) {
        openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
        const current = openSet.shift();

        if (current.x === targetX && current.y === targetY) {
            return current.path;
        }

        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 1, dy: 0 },  // Right
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }  // Left
        ];

        for (const dir of directions) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;

            if (visited.has(`${nx},${ny}`)) continue;
            if (!canMoveTo(unit, nx, ny, true)) continue;

            // Avoid tiles occupied by other units or cities unless it's the target
            const isTargetTile = nx === targetX && ny === targetY;
            if (!isTargetTile && (findCityAt(nx, ny) || findUnitAt(nx, ny) || findBuildingAt(nx, ny))) continue;

            const tile = gameState.map[ny][nx];
            const moveCost = tile.moveCost || 1;

            visited.add(`${nx},${ny}`);
            openSet.push({
                x: nx,
                y: ny,
                g: current.g + moveCost,
                h: heuristic(nx, ny, targetX, targetY),
                path: [...current.path, { x: nx, y: ny }]
            });
        }
    }

    return [];
}

function heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function handleTileRightClick(x, y) {
    // Clear highlights immediately when starting movement
    clearAttackRangeHighlights();
    
    if (gameState.selectedCity) {
        // Check if we're trying to build a building
        const currentPlayer = gameState.players[gameState.currentPlayer];
        const city = gameState.selectedCity;
        
        // Check if the clicked tile is adjacent to the city
        const dx = Math.abs(city.x - x);
        const dy = Math.abs(city.y - y);
        const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
        
        if (isAdjacent && !findBuildingAt(x, y)) {
            // Check if player can build a building here
            // (This would be handled by the building construction UI)
            return;
        }
        return;
    }

    if (gameState.selectedUnit && gameState.selectedUnit.player === gameState.currentPlayer) {
        const selectedUnit = gameState.selectedUnit;
        const unitType = UNIT_TYPES[selectedUnit.type];

        if (unitType.range) {
            const targetUnit = findUnitAt(x, y);
            const targetCity = findCityAt(x, y);
            const targetBuilding = findBuildingAt(x, y);

            if ((targetUnit && targetUnit.player !== selectedUnit.player) || 
                (targetCity && targetCity.player !== selectedUnit.player) ||
                (targetBuilding && targetBuilding.player !== selectedUnit.player)) {
                performRangedAttack(selectedUnit, x, y);
                gameState.mapDirty = true;
                renderMap();
                updateUI();
                return;
            }
        }

        const path = findPath(selectedUnit.x, selectedUnit.y, x, y, selectedUnit);
        if (path.length > 0) {
            // Clear any remaining highlights
            clearAttackRangeHighlights();
            
            gameState.unitDestinations[selectedUnit.id] = {
                targetX: x,
                targetY: y,
                path: path
            };

            if (selectedUnit.moves > 0) {
                const nextStep = path[0];
                if (canMoveTo(selectedUnit, nextStep.x, nextStep.y)) {
                    moveUnit(selectedUnit, nextStep.x, nextStep.y);
                }
            }
        }
    }
    gameState.mapDirty = true;
    renderMap();
    updateUI();
}

function findRangedTarget(unit, aiPlayer) {
    const unitType = UNIT_TYPES[unit.type];
    if (!unitType.range) return null;

    let closestTarget = null;
    let closestDistance = Infinity;

    for (const player of gameState.players) {
        if (player.id !== aiPlayer.id) {
            for (const enemyUnit of player.units) {
                const dx = Math.abs(unit.x - enemyUnit.x);
                const dy = Math.abs(unit.y - enemyUnit.y);

                // Ensure the target is within range and only orthogonal
                if ((dx === 0 || dy === 0) && dx + dy <= unitType.range) {
                    const distance = dx + dy;
                    if (distance < closestDistance) {
                        closestTarget = enemyUnit;
                        closestDistance = distance;
                    }
                }
            }

            for (const enemyCity of player.cities) {
                const dx = Math.abs(unit.x - enemyCity.x);
                const dy = Math.abs(unit.y - enemyCity.y);

                // Ensure the target is within range and only orthogonal
                if ((dx === 0 || dy === 0) && dx + dy <= unitType.range) {
                    const distance = dx + dy;
                    if (distance < closestDistance) {
                        closestTarget = enemyCity;
                        closestDistance = distance;
                    }
                }
            }

            for (const enemyBuilding of gameState.buildings) {
                if (enemyBuilding.player !== aiPlayer.id) {
                    const dx = Math.abs(unit.x - enemyBuilding.x);
                    const dy = Math.abs(unit.y - enemyBuilding.y);

                    // Ensure the target is within range and only orthogonal
                    if ((dx === 0 || dy === 0) && dx + dy <= unitType.range) {
                        const distance = dx + dy;
                        if (distance < closestDistance) {
                            closestTarget = enemyBuilding;
                            closestDistance = distance;
                        }
                    }
                }
            }
        }
    }

    return closestTarget;
}

function aiTurn(aiPlayer) {
    // Calculate current food situation
    const totalFood = aiPlayer.cities.reduce((sum, city) => sum + city.food, 0);
    const foodConsumption = aiPlayer.units.reduce((sum, unit) => sum + UNIT_TYPES[unit.type].foodConsumption, 0);
    const foodBalance = totalFood - foodConsumption;

    const threats = assessThreats(aiPlayer);
    const expansionOpportunities = findExpansionOpportunities(aiPlayer);

    // AI building construction logic
    for (const city of aiPlayer.cities) {
        // Skip if there is already an ongoing construction near the city
        const hasOngoingConstruction = gameState.buildings.some(b =>
            b.type.endsWith('_CONSTRUCTION') &&
            b.player === aiPlayer.id &&
            Math.abs(b.x - city.x) <= 1 &&
            Math.abs(b.y - city.y) <= 1
        );
        if (hasOngoingConstruction) continue;

        // Evaluate all possible buildings
        const buildingOptions = Object.entries(BUILDING_TYPES)
            .filter(([buildingType, buildingDef]) => {
                // Check if the AI has researched the required technology
                if (buildingDef.requires && !aiPlayer.researchedTechs.has(buildingDef.requires)) {
                    return false;
                }

                // Check if the AI has enough gold
                if (aiPlayer.gold < buildingDef.goldCost) {
                    return false;
                }

                // Check if the building is a library and if one already exists near the city
                if (buildingType === 'LIBRARY') {
                    const hasLibrary = gameState.buildings.some(b =>
                        b.type === 'LIBRARY' &&
                        b.player === aiPlayer.id &&
                        Math.abs(b.x - city.x) + Math.abs(b.y - city.y) <= 1
                    );
                    if (hasLibrary) {
                        return false;
                    }
                }

                return true;
            });

        // Prioritize buildings (e.g., libraries over granaries)
        buildingOptions.sort(([typeA, defA], [typeB, defB]) => {
            if (typeA === 'LIBRARY') return -1; // Libraries are prioritized
            if (typeB === 'LIBRARY') return 1;
            return defA.goldCost - defB.goldCost; // Otherwise, prioritize cheaper buildings
        });

        // Attempt to build the highest-priority building
        for (const [buildingType, buildingDef] of buildingOptions) {
            const directions = [
                { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
                { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
            ].sort(() => Math.random() - 0.5); // Randomize direction order

            for (const dir of directions) {
                const nx = city.x + dir.dx;
                const ny = city.y + dir.dy;

                if (ny >= 0 && ny < gameState.map.length &&
                    nx >= 0 && nx < gameState.map[0].length &&
                    canBuildBuilding(aiPlayer, buildingType, nx, ny)) {
                    
                    if (buildBuilding(aiPlayer, buildingType, nx, ny)) {
                        logMessage(`${aiPlayer.name} started building a ${buildingDef.name} near ${city.name}.`, aiPlayer.id);
                        break;
                    }
                }
            }
        }
    }

    // City production logic
    for (const city of aiPlayer.cities) {
        if (!city.currentProduction) {
            const options = [];
            
            // Only consider settlers if we have positive food balance
            if (expansionOpportunities.length > 0 && foodBalance > 2 && Math.random() > 0.5) {
                options.push('SETTLER');
            }

            // Military units based on threat level
            const militaryNeeded = threats.length > 0 || isHostile(aiPlayer);
            if (militaryNeeded) {
                // Don't overproduce if we're already at food limit
                if (foodBalance > 0 || aiPlayer.units.length < aiPlayer.cities.length * 3) {
                    options.push('WARRIOR');
                    if (aiPlayer.researchedTechs.has('ARCHERY')) options.push('ARCHER');
                    if (aiPlayer.researchedTechs.has('BRONZE_WORKING')) options.push('SPEARMAN');
                }
            }

            // Default to economic focus if no pressing needs
            if (options.length === 0 && foodBalance < 1) {
                // Maybe build something that generates food in future updates
                continue;
            }

            // Fallback to warriors if nothing else (but limited by food)
            if (options.length === 0 && aiPlayer.units.length < aiPlayer.cities.length * 4) {
                options.push('WARRIOR');
            }

            if (options.length > 0) {
                const selectedUnit = options[Math.floor(Math.random() * options.length)];
                const unitDef = UNIT_TYPES[selectedUnit];
                
                if (aiPlayer.gold >= unitDef.goldCost) {
                    aiPlayer.gold -= unitDef.goldCost;
                    city.currentProduction = selectedUnit;
                    city.production = 0;
                }
            }
        }
    }

    if (aiPlayer.currentResearch) {
        aiPlayer.research += 2;
        const tech = TECH_TREE[aiPlayer.currentResearch];
        if (aiPlayer.research >= tech.cost) {
            aiPlayer.researchedTechs.add(aiPlayer.currentResearch);
            logMessage(`${aiPlayer.name} completed research on ${tech.name}.`, aiPlayer.id);
            aiPlayer.currentResearch = null;
            aiPlayer.research = 0;
        }
    }

    if (!aiPlayer.currentResearch) {
        const availableTechs = Object.keys(TECH_TREE).filter(techId =>
            canResearchTech(aiPlayer, techId)
        );

        if (availableTechs.length > 0) {
            aiPlayer.currentResearch = prioritizeResearch(aiPlayer, availableTechs);
            aiPlayer.research = 0;
            logMessage(`${aiPlayer.name} started researching ${TECH_TREE[aiPlayer.currentResearch].name}.`, aiPlayer.id);
        }
    }

    if (!aiPlayer.isHuman) {
        aiTradeWithPlayer(aiPlayer);
    }

    aiTradeWithOtherAIs(aiPlayer);

    for (const unit of aiPlayer.units) {
        const target = unit.type.range ? findRangedTarget(unit, aiPlayer) : findBestTarget(unit, aiPlayer, threats, expansionOpportunities);

        if (unit.moves > 0) {
            const unitType = UNIT_TYPES[unit.type];

            if (unit.type === 'SETTLER') {
                // Check the current tile's score
                const currentTileScore = evaluateTileScore(unit.x, unit.y, aiPlayer);
            
                // Check if the current tile is better than nearby opportunities
                if (currentTileScore >= 18 && !findCityAt(unit.x, unit.y)) {
                    foundCity(unit, unit.x, unit.y);
                    return;
                }
            
                // Find the best nearby opportunity
                const validTile = expansionOpportunities.find(opportunity =>
                    Math.abs(unit.x - opportunity.x) + Math.abs(unit.y - opportunity.y) <= 1 &&
                    opportunity.score >= 18 &&
                    !findCityAt(opportunity.x, opportunity.y) // Ensure no city exists on the tile
                );
            
                if (validTile) {
                    // Check if the settler is already adjacent to the valid tile
                    const distance = Math.abs(unit.x - validTile.x) + Math.abs(unit.y - validTile.y);
                    if (distance === 1) {
                        // If adjacent, found the city
                        foundCity(unit, validTile.x, validTile.y);
                    } else {
                        // Otherwise, move step-by-step toward the valid tile
                        const path = findPath(unit.x, unit.y, validTile.x, validTile.y, unit);
                        if (path.length > 0) {
                            const nextStep = path[0];
                            if (canMoveTo(unit, nextStep.x, nextStep.y)) {
                                moveUnit(unit, nextStep.x, nextStep.y);
                            }
                        }
                    }
                    continue;
                } else {
                    // No valid tile nearby, continue exploring
                    const nextOpportunity = expansionOpportunities.find(opportunity =>
                        !findCityAt(opportunity.x, opportunity.y) // Ensure no city exists on the tile
                    );
                    if (nextOpportunity) {
                        const path = findPath(unit.x, unit.y, nextOpportunity.x, nextOpportunity.y, unit);
                        if (path.length > 0) {
                            const nextStep = path[0];
                            if (canMoveTo(unit, nextStep.x, nextStep.y)) {
                                moveUnit(unit, nextStep.x, nextStep.y); // Use moveUnit to handle multi-turn movement
                            }
                        }
                    } else {
                        // No opportunities left, explore the map
                        explore(unit, aiPlayer);
                    }
                }
            
                // Ensure the settler does not move again this turn
                unit.moves = 0;
            } else if (target && target.player !== undefined) {
                const targetPlayer = gameState.players[target.player];
                if (aiPlayer.relations[targetPlayer.id]?.attitude < 60) {
                    if (unitType.range) {
                        // Perform ranged attack if in range
                        const dx = Math.abs(unit.x - target.x);
                        const dy = Math.abs(unit.y - target.y);
                        if (dx + dy <= unitType.range && (dx === 0 || dy === 0)) {
                            performRangedAttack(unit, target.x, target.y);
                        } else {
                            // Move closer to the target if out of range
                            const path = findPath(unit.x, unit.y, target.x, target.y, unit);
                            if (path.length > 0) {
                                const nextStep = path[0];
                                moveUnit(unit, nextStep.x, nextStep.y);
                            }
                        }
                    } else {
                        // Melee units need to move into range before attacking
                        const path = findPath(unit.x, unit.y, target.x, target.y, unit);
                        if (path.length > 0) {
                            const nextStep = path[0];
                            const distance = Math.abs(nextStep.x - target.x) + Math.abs(nextStep.y - target.y);
                            if (distance === 1) {
                                // If adjacent to the target, attack
                                moveUnit(unit, nextStep.x, nextStep.y);
                                performRangedAttack(unit, target.x, target.y); // Melee attack uses the same function
                            } else {
                                // Otherwise, move closer
                                moveUnit(unit, nextStep.x, nextStep.y);
                            }
                        }
                    }
                    continue;
                }
            }

            // If we get here, no valid target was found - explore instead
            explore(unit, aiPlayer);
        }
    }
}

function aiTradeWithOtherAIs(aiPlayer) {
    for (const otherAI of gameState.players) {
        if (otherAI.id !== aiPlayer.id && !otherAI.isHuman) {
            const relation = aiPlayer.relations[otherAI.id];

            // Ensure both AI players have researched "Writing"
            if (!aiPlayer.researchedTechs.has('WRITING') || !otherAI.researchedTechs.has('WRITING')) {
                continue;
            }

            const tradeDistance = 7;
            const canTrade = aiPlayer.cities.some(aiCity =>
                otherAI.cities.some(otherCity =>
                    Math.abs(aiCity.x - otherCity.x) + Math.abs(aiCity.y - otherCity.y) <= tradeDistance
                )
            );

            if (!canTrade) continue;

            const tradeChance = relation.attitude / 100;
            if (Math.random() > tradeChance) continue;

            const goldOffered = Math.floor(Math.random() * 20) + 10;
            const reputationBoost = Math.floor(Math.random() * 5) + 5;

            aiPlayer.relations[otherAI.id].hasMet = true;
            otherAI.relations[aiPlayer.id].hasMet = true;

            aiPlayer.gold -= goldOffered;
            otherAI.gold += goldOffered;
            aiPlayer.relations[otherAI.id].attitude = Math.min(100, relation.attitude + reputationBoost);
            otherAI.relations[aiPlayer.id].attitude = Math.min(100, otherAI.relations[aiPlayer.id].attitude + reputationBoost);

            logMessage(`${aiPlayer.name} traded ${goldOffered} gold with ${otherAI.name}. Relations improved!`, aiPlayer.id, otherAI.id);
        }
    }
}

function explore(unit, aiPlayer) {
    const radius = 3; // Limit exploration to a 3-tile radius

    // If the unit already has a target, continue moving toward it
    if (unit.targetX !== undefined && unit.targetY !== undefined) {
        const path = findPath(unit.x, unit.y, unit.targetX, unit.targetY, unit);

        if (path.length > 0) {
            const nextStep = path[0];
            if (canMoveTo(unit, nextStep.x, nextStep.y)) {
                moveUnit(unit, nextStep.x, nextStep.y);
                return; // Continue moving toward the current target
            } else {
                // If the path is blocked, clear the target and choose a new one
                unit.targetX = undefined;
                unit.targetY = undefined;
            }
        } else {
            // If the path is invalid, clear the target and choose a new one
            unit.targetX = undefined;
            unit.targetY = undefined;
        }
    }

    // If no target is set, choose a new random tile within the radius
    const validTiles = [];
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const nx = unit.x + dx;
            const ny = unit.y + dy;

            if (ny >= 0 && ny < gameState.map.length &&
                nx >= 0 && nx < gameState.map[0].length) {
                
                // Skip tiles that are occupied or invalid
                if (!canMoveTo(unit, nx, ny, true) || 
                    findCityAt(nx, ny) || 
                    findUnitAt(nx, ny) || 
                    findBuildingAt(nx, ny)) {
                    continue;
                }

                validTiles.push({ x: nx, y: ny });
            }
        }
    }

    // If there are valid tiles, pick one at random and set it as the target
    if (validTiles.length > 0) {
        const targetTile = validTiles[Math.floor(Math.random() * validTiles.length)];
        unit.targetX = targetTile.x;
        unit.targetY = targetTile.y;

        // Start moving toward the new target
        const path = findPath(unit.x, unit.y, unit.targetX, unit.targetY, unit);
        if (path.length > 0) {
            const nextStep = path[0];
            if (canMoveTo(unit, nextStep.x, nextStep.y)) {
                moveUnit(unit, nextStep.x, nextStep.y);
            }
        }
    }
}

function assessThreats(aiPlayer) {
    const threats = [];
    for (const player of gameState.players) {
        if (player.id !== aiPlayer.id) {
            for (const unit of player.units) {
                for (const city of aiPlayer.cities) {
                    const distance = Math.abs(unit.x - city.x) + Math.abs(unit.y - city.y);
                    if (distance <= 2) {
                        threats.push({ unit, city, distance });
                    }
                }
            }
        }
    }
    return threats;
}

function findExpansionOpportunities(aiPlayer) {
    const opportunities = [];

    for (let y = 0; y < gameState.map.length; y++) {
        for (let x = 0; x < gameState.map[y].length; x++) {
            const tile = gameState.map[y][x];

            if (tile.name !== 'Ocean' && tile.name !== 'Coast' && !findCityAt(x, y) && !findBuildingAt(x, y)) {
                const score = evaluateTileScore(x, y, aiPlayer);
                if (score > 0) {
                    opportunities.push({ x, y, score });
                }
            }
        }
    }

    opportunities.sort((a, b) => b.score - a.score);

    return opportunities;
}

function isHostile(aiPlayer) {
    return Object.values(aiPlayer.relations).some(rel => rel.attitude < 40);
}

function findBestTarget(unit, aiPlayer, threats, expansionOpportunities) {
    if (threats.length > 0) {
        return threats.reduce((closest, threat) =>
            threat.distance < closest.distance ? threat : closest
        ).unit;
    }

    const hostilePlayers = gameState.players.filter(player =>
        player.id !== aiPlayer.id && aiPlayer.relations[player.id]?.attitude < 40
    );

    if (hostilePlayers.length > 0) {
        let closestTarget = null;
        let closestDistance = Infinity;

        for (const hostilePlayer of hostilePlayers) {
            // Check enemy units
            for (const enemyUnit of hostilePlayer.units) {
                const dist = Math.abs(unit.x - enemyUnit.x) + Math.abs(unit.y - enemyUnit.y);
                if (dist < closestDistance && canAttack(unit, enemyUnit)) {
                    closestDistance = dist;
                    closestTarget = enemyUnit;
                }
            }

            // Check enemy cities
            for (const enemyCity of hostilePlayer.cities) {
                const dist = Math.abs(unit.x - enemyCity.x) + Math.abs(unit.y - enemyCity.y);
                if (dist < closestDistance) {
                    closestDistance = dist;
                    closestTarget = enemyCity;
                }
            }

            // Check enemy buildings
            for (const building of gameState.buildings) {
                if (building.player === hostilePlayer.id) {
                    const dist = Math.abs(unit.x - building.x) + Math.abs(unit.y - building.y);
                    if (dist < closestDistance) {
                        closestDistance = dist;
                        closestTarget = building;
                    }
                }
            }
        }

        if (closestTarget) return closestTarget;
    }

    if (unit.type === 'SETTLER' && expansionOpportunities.length > 0) {
        return expansionOpportunities[0];
    }

    // Default to exploring if no target found
    return null;
}

function prioritizeResearch(aiPlayer, availableTechs) {
    const hostileRelations = Object.values(aiPlayer.relations).some(rel => rel.attitude < 40);
    if (hostileRelations) {
        const militaryTechs = availableTechs.filter(tech =>
            ['ARCHERY', 'BRONZE_WORKING'].includes(tech)
        );
        if (militaryTechs.length > 0) {
            return militaryTechs[Math.floor(Math.random() * militaryTechs.length)];
        }
    }

    const expansionTechs = availableTechs.filter(tech =>
        ['POTTERY', 'WRITING'].includes(tech)
    );
    if (expansionTechs.length > 0) {
        return expansionTechs[Math.floor(Math.random() * expansionTechs.length)];
    }

    return availableTechs[Math.floor(Math.random() * availableTechs.length)];
}

function findNearestTarget(unit, aiPlayer) {
    let closestTarget = null;
    let closestDistance = Infinity;

    for (const player of gameState.players) {
        if (player.id !== aiPlayer.id && aiPlayer.relations[player.id].hasMet) {
            for (const enemyUnit of player.units) {
                const dist = Math.abs(unit.x - enemyUnit.x) + Math.abs(unit.y - enemyUnit.y);
                if (dist < closestDistance && canAttack(unit, enemyUnit)) {
                    closestDistance = dist;
                    closestTarget = enemyUnit;
                }
            }

            for (const enemyCity of player.cities) {
                const dist = Math.abs(unit.x - enemyCity.x) + Math.abs(unit.y - enemyCity.y);
                if (dist < closestDistance) {
                    closestDistance = dist;
                    closestTarget = enemyCity;
                }
            }

            for (const enemyBuilding of gameState.buildings) {
                if (enemyBuilding.player === player.id) {
                    const dist = Math.abs(unit.x - enemyBuilding.x) + Math.abs(unit.y - enemyBuilding.y);
                    if (dist < closestDistance) {
                        closestDistance = dist;
                        closestTarget = enemyBuilding;
                    }
                }
            }
        }
    }

    return closestTarget;
}

// Update the UI
function updateUI() {
    const currentPlayer = gameState.players[gameState.currentPlayer];

    const totalFood = currentPlayer.cities.reduce((sum, city) => sum + city.food, 0);
    const foodConsumption = currentPlayer.units.reduce((sum, unit) => sum + UNIT_TYPES[unit.type].foodConsumption, 0);
    document.getElementById('food-counter').textContent = `${totalFood} (${foodConsumption} used)`;
    
    document.getElementById('turn-counter').textContent = gameState.turn;
    document.getElementById('gold-counter').textContent = currentPlayer.gold;
    document.getElementById('research-counter').textContent = currentPlayer.research;
    
    if (currentPlayer.currentResearch) {
        const tech = TECH_TREE[currentPlayer.currentResearch];
        document.getElementById('research-needed').textContent = tech.cost;
        document.getElementById('current-tech').textContent = tech.name;
    } else {
        document.getElementById('research-needed').textContent = '0';
        document.getElementById('current-tech').textContent = 'None';
    }
    
    if (document.getElementById('diplomacy-panel').style.display === 'block') {
        showDiplomacy();
    }

    if (gameState.selectedCity) {
        showCityPanel(gameState.selectedCity);
    }
}

// Show diplomacy panel
function showDiplomacy() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const relationsContainer = document.getElementById('relations-container');
    relationsContainer.innerHTML = '';
    
    for (const player of gameState.players) {
        if (player.id !== currentPlayer.id) {
            const relation = currentPlayer.relations[player.id];
            
            if (relation.hasMet) {
                const relationElement = document.createElement('div');
                relationElement.innerHTML = `
                    <h4>${player.name}</h4>
                    <div class="relation-bar">
                        <div class="relation-fill" style="width: ${relation.attitude}%"></div>
                        <div class="relation-text">${getRelationText(relation.attitude)} (${relation.attitude})</div>
                    </div>
                `;

                // Check if "Writing" has been researched
                if (currentPlayer.researchedTechs.has('WRITING')) {
                    relationElement.innerHTML += `
                        <button onclick="proposeTrade(${player.id})">Propose Trade</button>
                        <button onclick="declareWar(${player.id})" style="background-color: red; color: white;">Declare War</button>
                    `;
                } else {
                    relationElement.innerHTML += `
                        <p style="color: gray;">Research "Writing" to unlock diplomacy options.</p>
                    `;
                }

                relationsContainer.appendChild(relationElement);
            } else {
                const relationElement = document.createElement('div');
                relationElement.innerHTML = `<h4>${player.name}</h4><p>You have not met this civilization yet.</p>`;
                relationsContainer.appendChild(relationElement);
            }
        }
    }
    
    document.getElementById('diplomacy-panel').style.display = 'block';
}

function declareWar(targetPlayerId) {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const targetPlayer = gameState.players[targetPlayerId];

    // Set reputation to 0 on both sides
    currentPlayer.relations[targetPlayerId].attitude = 0;
    targetPlayer.relations[currentPlayer.id].attitude = 0;

    logMessage(`${currentPlayer.name} has declared war on ${targetPlayer.name}!`, currentPlayer.id, targetPlayerId);

    updateUI();
}

function proposeTrade(aiPlayerId) {
    const humanPlayer = gameState.players[0];
    const aiPlayer = gameState.players[aiPlayerId];
    const relation = humanPlayer.relations[aiPlayerId];

    const tradeDistance = 7;
    const canTrade = humanPlayer.cities.some(humanCity =>
        aiPlayer.cities.some(aiCity =>
            Math.abs(humanCity.x - aiCity.x) + Math.abs(humanCity.y - aiCity.y) <= tradeDistance
        )
    );

    if (!canTrade) {
        alert("Your cities are too far apart to trade with this civilization.");
        return;
    }

    // Prompt the player for the amount of gold to trade
    const goldOffered = parseInt(prompt(`How much gold do you want to offer to ${aiPlayer.name}?`, "10"), 10);

    // Validate the input
    if (isNaN(goldOffered) || goldOffered <= 0) {
        alert("Invalid amount of gold.");
        return;
    }

    if (humanPlayer.gold < goldOffered) {
        alert("You don't have enough gold to propose this trade.");
        return;
    }

    // Calculate reputation gain based on the gold offered
    const reputationBoost = Math.floor(goldOffered / 1.5);

    // AI will only decline if their reputation is below 15
    const aiAccepts = relation.attitude >= 15;

    humanPlayer.relations[aiPlayerId].hasMet = true;
    aiPlayer.relations[humanPlayer.id].hasMet = true;

    if (aiAccepts) {
        // Deduct gold and update relations
        humanPlayer.gold -= goldOffered;
        aiPlayer.gold += goldOffered;
        humanPlayer.relations[aiPlayerId].attitude = Math.min(100, relation.attitude + reputationBoost);
        aiPlayer.relations[humanPlayer.id].attitude = Math.min(100, aiPlayer.relations[humanPlayer.id].attitude + reputationBoost);

        logMessage(`${humanPlayer.name} successfully traded ${goldOffered} gold with ${aiPlayer.name}. Relations improved by ${reputationBoost} points!`, aiPlayerId, humanPlayer.id);
    } else {
        // AI declines the trade
        logMessage(`${aiPlayer.name} declined a trade proposal from ${humanPlayer.name}.`, aiPlayerId, humanPlayer.id);
        humanPlayer.relations[aiPlayerId].attitude = Math.max(0, relation.attitude - 2);
        aiPlayer.relations[humanPlayer.id].attitude = Math.max(0, aiPlayer.relations[humanPlayer.id].attitude - 2);
    }

    updateUI();
}

function getRelationText(attitude) {
    if (attitude >= 80) return 'Allied';
    if (attitude >= 60) return 'Friendly';
    if (attitude >= 40) return 'Neutral';
    if (attitude >= 20) return 'Unfriendly';
    return 'Hostile';
}

function hideDiplomacy() {
    document.getElementById('diplomacy-panel').style.display = 'none';
}

function showTechTree() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const techTreeElement = document.getElementById('tech-tree');
    techTreeElement.innerHTML = '';
    
    for (const [techId, tech] of Object.entries(TECH_TREE)) {
        const techElement = document.createElement('div');
        techElement.className = 'tech-item';
        
        if (currentPlayer.researchedTechs.has(techId)) {
            techElement.classList.add('researched');
        } else if (canResearchTech(currentPlayer, techId)) {
            techElement.classList.add('available');
            techElement.addEventListener('click', () => selectTech(techId));
        }
        
        techElement.innerHTML = `
            <strong>${tech.name}</strong> (${tech.cost})<br>
            <small>${tech.description}</small>
        `;
        
        techTreeElement.appendChild(techElement);
    }
    
    document.getElementById('tech-panel').style.display = 'block';
}

function canResearchTech(player, techId) {
    if (player.researchedTechs.has(techId)) return false;
    
    const tech = TECH_TREE[techId];
    for (const [otherTechId, otherTech] of Object.entries(TECH_TREE)) {
        if (otherTech.leadsTo && otherTech.leadsTo.includes(techId)) {
            if (player.researchedTechs.has(otherTechId)) return true;
        }
    }
    
    const hasPrereq = Object.values(TECH_TREE).some(t => t.leadsTo && t.leadsTo.includes(techId));
    return !hasPrereq;
}

function selectTech(techId) {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    currentPlayer.currentResearch = techId;
    currentPlayer.research = 0;
    hideTechTree();
    updateUI();
}

function hideTechTree() {
    document.getElementById('tech-panel').style.display = 'none';
}

function showCityPanel(city) {
    const cityInfoElement = document.getElementById('city-info');
    const cityProductionElement = document.getElementById('city-production');
    const player = gameState.players[city.player];

    cityInfoElement.innerHTML = `
        <h4>${city.name}</h4>
        <p>Production: ${city.production}/${city.currentProduction ? UNIT_TYPES[city.currentProduction]?.cost : '0'}</p>
        <p>Gold: ${player.gold}</p>
    `;

    cityProductionElement.innerHTML = `
        <h5>Units:</h5>
        <div id="unit-production"></div>
        <h5>Buildings:</h5>
        <div id="building-production"></div>
    `;

    // Check if there is an ongoing construction near the city
    const hasOngoingConstruction = gameState.buildings.some(b =>
        b.type.endsWith('_CONSTRUCTION') &&
        b.player === player.id &&
        Math.abs(b.x - city.x) <= 1 &&
        Math.abs(b.y - city.y) <= 1
    );

    // Unit production
    const unitProductionElement = document.getElementById('unit-production');
    for (const [unitType, unitDef] of Object.entries(UNIT_TYPES)) {
        // Skip units that require a technology the player hasn't researched
        if (unitDef.requires && !player.researchedTechs.has(unitDef.requires)) {
            continue;
        }

        const button = document.createElement('button');
        button.textContent = `${unitDef.name} (${unitDef.goldCost} gold)`;
        button.title = unitDef.description || "No description available"; // Add description as tooltip
        button.onclick = () => startUnitProduction(unitType, city.x, city.y);
        unitProductionElement.appendChild(button);
    }

    // Building production
    const buildingProductionElement = document.getElementById('building-production');
    for (const [buildingType, buildingDef] of Object.entries(BUILDING_TYPES)) {
        // Skip the building if the required technology hasn't been researched
        if (buildingDef.requires && !player.researchedTechs.has(buildingDef.requires)) {
            continue;
        }

        const button = document.createElement('button');
        button.textContent = `${buildingDef.name} (${buildingDef.goldCost} gold)`;
        button.title = buildingDef.description || "No description available"; // Add description as tooltip

        // Disable the button if there is an ongoing construction
        if (hasOngoingConstruction) {
            button.disabled = true;
            button.title = "A building is already under construction near this city.";
        }

        // Check if the building is a library and if one already exists near the city
        if (buildingType === 'LIBRARY') {
            const hasLibrary = gameState.buildings.some(b =>
                b.type === 'LIBRARY' &&
                b.player === player.id &&
                Math.abs(b.x - city.x) + Math.abs(b.y - city.y) <= 1
            );
            if (hasLibrary) {
                button.disabled = true; // Disable the button if a library exists
                button.title = "A library already exists near this city.";
            }
        }

        button.onclick = () => startBuildingConstruction(city.x, city.y, buildingType);
        buildingProductionElement.appendChild(button);
    }

    document.getElementById('city-panel').style.display = 'block';
}

function startBuildingConstruction(cityX, cityY, buildingType) {
    clearAttackRangeHighlights();
    const city = findCityAt(cityX, cityY);
    const player = gameState.players[city.player];
    const buildingDef = BUILDING_TYPES[buildingType];
    
    if (player.gold < buildingDef.goldCost) {
        alert(`Not enough gold! Need ${buildingDef.goldCost} gold.`);
        return;
    }

    // Highlight adjacent tiles
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 1, dy: 0 },  // Right
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }  // Left
    ];

    // Store the city location and building type for building placement
    gameState.buildingConstruction = {
        cityX: cityX,
        cityY: cityY,
        playerId: player.id,
        buildingType: buildingType
    };

    // Highlight valid tiles
    gameState.highlightedTiles = [];
    for (const dir of directions) {
        const nx = cityX + dir.dx;
        const ny = cityY + dir.dy;

        if (ny >= 0 && ny < gameState.map.length && nx >= 0 && nx < gameState.map[0].length) {
            const tile = gameState.map[ny][nx];
            if (tile.name !== 'Ocean' && tile.name !== 'Coast' && !findBuildingAt(nx, ny)) {
                gameState.highlightedTiles.push({ x: nx, y: ny });
                const tileElement = document.querySelector(`.tile[data-x="${nx}"][data-y="${ny}"]`);
                if (tileElement) {
                    tileElement.classList.add('buildable');
                }
            }
        }
    }

    if (gameState.highlightedTiles.length === 0) {
        alert("No valid adjacent tiles to build this building!");
        delete gameState.buildingConstruction;
        return;
    }

    alert(`Click on an adjacent highlighted tile to build the ${buildingDef.name}`);
    gameState.mapDirty = true;
    renderMap();
}

function startUnitProduction(unitType, x, y) {
    const player = gameState.players[gameState.currentPlayer];
    const city = findCityAt(x, y);
    
    if (city.currentProduction) {
        alert("This city is already producing something!");
        return;
    }

    const unitDef = UNIT_TYPES[unitType];
    
    if (player.gold >= unitDef.goldCost) {
        player.gold -= unitDef.goldCost;
        city.currentProduction = unitType;
        city.production = 0; // Reset production counter
        updateUI();
    } else {
        alert("Not enough gold to start production!");
    }
}

function hideCityPanel() {
    document.getElementById('city-panel').style.display = 'none';
    gameState.selectedCity = null;
}

// Initialize the game when the page loads
window.onload = initGame;