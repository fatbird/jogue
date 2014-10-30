function Dungeon(options) {
    this.width = options.width;
    this.height = options.height;
    this.maxX = this.width - 1;
    this.maxY = this.height - 1;
    this.levels = [];
    this.currentLevel = undefined;
    this.levelIndex = undefined;
    this.context = options.context;
    this.hero = this.context.hero;
}

Dungeon.prototype.addLevel = function(start, parent) {
    if (parent && ! this.parent) { this.parent = parent; }
    if (! parent) { parent = this.parent; }
    this.levels.push(new Level({width: this.width,
                                height: this.height,
                                level: this.levels.length + 1,
                                start: start,
                                dungeon: this,
                                context: this.context}));
    parent.appendChild(this.levels[this.levels.length - 1].element);
    this.levels[this.levels.length - 1].generateLevel();
    if (this.currentLevel === undefined) {
        this.currentLevel = this.levels[0];
        window.level = this.currentLevel;
        this.levelIndex = 0;
    }
};

var LEFT = 0, UP = 1, RIGHT = 2, DOWN = 3, X = 0, Y = 1;
var N = 'i', NE = 'o', E = 'l', SE = '.', S = ',', SW = 'm', W = 'j', NW = 'u';
Dungeon.prototype.move = function(direction) {
    if (this.hero === undefined) { this.hero = this.context.hero; }
    var new_position = {x: this.hero.square.x, y: this.hero.square.y};
    allowed = false;
    switch(direction) {
    case N:
        new_position.y -= 1;
        break;
    case NE:
        new_position.x += 1;
        new_position.y -= 1;
        break;
    case E:
        new_position.x += 1;
        break;
    case SE:
        new_position.x += 1;
        new_position.y += 1;
        break;
    case S:
        new_position.y += 1;
        break;
    case SW:
        new_position.x -= 1;
        new_position.y += 1;
        break;
    case W:
        new_position.x -= 1;
        break;
    case NW:
        new_position.x -= 1;
        new_position.y -= 1;
        break;
    }
    new_position = this.currentLevel.grid[new_position.x][new_position.y];
    var can_move = false;
    if (new_position.entity === wall) { return; }
    else if (new_position.entity === floor ||
             new_position.entity === up ||
             new_position.entity === down ||
             new_position.entity.classes.indexOf("item") > -1) {
        can_move = true;
    }
    else if (new_position.entity.constructor === Mob) {
        can_move = false;
        this.attack(new_position);
    }
    if (can_move) {
        this.hero.square.remove(this.hero);
        this.hero.square = new_position;
        this.hero.square.add(this.hero);
        this.currentLevel.updateVisibility(this.hero.square);
    }
    this.checkMobs();
    this.context.refresh();
};
var awareness = [
    {x: -1, y: -1},
    {x: 0,  y: -1},
    {x: 1,  y: -1},
    {x: -1, y: 0},
    {x: 1,  y: 0},
    {x: -1, y: 1},
    {x: 0,  y: 1},
    {x: 1,  y: 1},
    {x: -2,  y: 0},
    {x: 0, y: -2},
    {x: 0, y: 2},
    {x: 2, y: 0}
];

/**
 * Check mob activity for movement or attacks
 */
Dungeon.prototype.checkMobs = function() {
    if (context.currentScreen !== context.dungeonScreen) { return; }
    awareness.forEach(function(d) {
        var x = Math.min(Math.max(0, this.hero.square.x + d.x), this.maxX),
            y = Math.min(Math.max(0, this.hero.square.y + d.y), this.maxY),
            square = this.currentLevel.grid[x][y];
        if (square.entity instanceof Mob) {
            if (! square.entity.aware()) {
                square.entity.aware(true);
                square.entity.wait = true;
            }
        }
    }, this);
    this.currentLevel.mobs.forEach(function(mob) {
        if (! mob.aware()) { return; }
        if (mob.wait) { mob.wait = false; return; }
        var dx = this.hero.square.x - mob.square.x,
            dy = this.hero.square.y - mob.square.y,
            nx = mob.square.x + Math.min(Math.max(dx, -1), 1),
            ny = mob.square.y + Math.min(Math.max(dy, -1), 1);
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {  // too far to attack, move
            if (this.currentLevel.grid[nx][ny].isOpen()) {
                if (random(0, 100) < 90) {   // small chance the mob falls behind
                    mob.square.remove(mob);
                    this.currentLevel.grid[nx][ny].add(mob);
                }
            } else {
                if ([true, false].choice()) { mob.aware(false); }
            }
        } else {
            this.defend(mob);
        }
    }, this);
};

/**
 * The hero attacks a mob
 *
 * Damage done is weapon damage, less a random factor that's equal to a number
 * within the range of 0 to half the weapon's damage, reduced by the number of
 * kills for the hero divided by a factor, rounded up.
 */
Dungeon.prototype.attack = function(square) {
    var mob = square.entity,
        damage = this.hero.equipped.damage,
        protection = mob.worn || mob.borne || {armor: 0},
        randomness = random(0, damage / 2) - Math.ceil(this.hero.killed / 7),
        actual = damage - randomness - protection.armor;
    actual = actual < 0 ? 0 : actual;
    mob.focused(true);
    if ([true, false].choice()) {
        context.add_message("You hit the {0} for {1} points of damage!"
                            .format(mob.kind, actual));
        mob.hp -= actual;
        if (mob.hp <= 0) {
            this.currentLevel.mobs.remove(mob);
            context.add_message("You killed the {0}!".format(mob.kind));
            this.hero.killed++;
            square.remove(mob);
            square.removeClass(["focused", "aware"]);
            var item = new Pile();
            item.contains.push(new Gold({amount: mob.gold}));
            if ([true, false].choice() && mob.equipped) {
                item.contains.push(mob.equipped);
            }
            if ([true, false].choice() && mob.worn) {
                item.contains.push(mob.worn);
            }
            square.add(item);
            return;
        }
    } else {
        context.add_message("You miss the {0}.".format(mob.name));
    }
};

/**
 * A mob attacks the hero
 */
Dungeon.prototype.defend = function(attacker) {
    var arm = attacker.equipped || attacker.has,
        actual = arm.damage - random(0, arm.damage) - this.hero.worn.armor;
    if ([true, false].choice() && actual > 0) {
        context.add_message("The {0} hits you for {1} points of damage with a {2}!"
                            .format(attacker.kind, actual, arm.kind));
        this.hero.hp -= actual;
        if (this.hero.hp <= 0) {
            context.currentScreen = context.gameOverScreen;
            context.gameOverScreen.element.innerHTML = gameOverText.format(
                level.level, attacker.kind, this.hero.gold,
                this.hero.equipped, this.hero.worn
            );
            context.dungeonScreen.element.style.display = "none";
            context.currentScreen.element.style.display = "block";
        }
    } else {
        context.add_message("The {0} misses you.".format(attacker.kind));
    }
};

/**
 * For whatever is on the same square as the hero use it however possible
 */
Dungeon.prototype.activate = function() {
    var square = this.hero.square;
    if (square.last() === up || square.last() === down) { this.exit(); }
    if (square.last().constructor === Item) {
        if (square.last().consumable && ! square.last().carryable) {
            var items = square.last().contains.slice(),
                found = false;
            while (item = items.shift()) {  // jshint ignore:line
                if ((item.armor || 0) > this.hero.worn.armor) {
                    this.hero.worn = item;
                    context.add_message("You found " + item.name + " armor!");
                    found = true;
                } else if ((item.damage || 0) > this.hero.equipped.damage) {
                    this.hero.equipped = item;
                    context.add_message("You found a " + item.name + "!");
                    context.print_status();
                    found = true;
                } else if (item.name === "Gold" && item.amount > 0) {
                    this.hero.gold += item.amount;
                    context.add_message("You found " + item.amount + " gold!");
                    found = true;
                } else if (item.name === "Chest" || item.name === "Pile") {
                    items.concat(item.contains);
                }
                context.print_status();
            }
            if (! found) {
                context.add_message(square.last().name + " was empty");
            }
            square._previous.shift();
        }
    }
};

/**
 * Leave the dungeon by staircase
 */
Dungeon.prototype.exit = function() {
    var loc = "entry";
    if (this.hero.square.x === this.currentLevel.entry.x &&
        this.hero.square.y === this.currentLevel.entry.y) {
        --this.levelIndex;
        this.hero.square.remove(this.hero);
        loc = "exit";
    } else if (this.hero.square.x === this.currentLevel.exit.x &&
               this.hero.square.y === this.currentLevel.exit.y) {
        if (this.levelIndex == this.levels.length - 1) {
            this.addLevel({x: this.hero.square.x, y: this.hero.square.y});
        }
        ++this.levelIndex;
        this.hero.square.remove(this.hero);
    } else {
        return;
    }
    // reset mob focus and awareness
    this.currentLevel.resetMobs(true);
    if (this.levelIndex < 0) {
        this.context.town();
        return;
    }
    this.currentLevel = this.levels[this.levelIndex];
    window.level = this.currentLevel;
    if (level.level > this.hero.level) {
        this.hero.level++;
        var increase = random(5, 10);
        this.hero.hp += increase;
        this.hero.max_hp += increase;
    }
    for (var ii = 0; ii < this.levels.length; ++ii) {
        if (ii === this.levelIndex) { continue; }
        this.levels[ii].element.style.display = "none";
    }
    this.currentLevel.element.style.display = "block";
    this.hero.square = this.currentLevel.grid[this.currentLevel[loc].x]
                                             [this.currentLevel[loc].y];
    this.hero.square.add(this.hero);
    this.currentLevel.updateVisibility(this.hero.square);
};


