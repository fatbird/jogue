/**
 * Return a random integer within min/max bounds; if not specified, min
 * defaults to 0 and max defaults to the length of the array.
 */
Array.prototype.random = function(min, max) {
    min = min || 0;
    max = max || this.length;
    return Math.floor(Math.random() * (max - min) + min);
};

/**
 * Return a random element from the array
 */
Array.prototype.choice = function() { return this[this.random()]; };

/**
 * Remove the item if found, return boolean indicating actual removal.
 */
Array.prototype.remove = function(item) {
    if ((ii = this.indexOf(item)) > -1) { return !! this.splice(ii, 1); }
    return false;
};

/**
 * Remove and return a random element, or undefined from an empty array.
 */
Array.prototype.draw = function() {
    return this.splice(this.random(), 1)[0];
};

/**
 * Return the last element of the array
 */
Array.prototype.last = function() { return this[this.length - 1]; };


/**
 * Return the string padded with spaces on the left to the specified length;
 * truncates the string to the specified length from the right if necessary
 */
var spaces = "                                        ";
String.prototype.lpad = function(length, classes) {
    var string = (spaces + (this || "")).slice(0 - length);
    string = "<span class='" + (classes || "") + "'>" + string + "</span>";
    return string;
};

/**
 * Return the string padded with spaces on the right to the specified length;
 * truncates the string to the specified length from the left if necessary
 */
String.prototype.rpad = function(length, classes) {
    var string = ((this || "") + spaces).slice(0, length);
    string = "<span class='" + (classes || "") + "'>" + string + "</span>";
    return string;
};

/**
 * Return the object's name attribute if it has one, standard string otherwise
 */
Object.prototype.toString = function() { return this.name || "[object Object]"; };


function Dungeon(options) {
    this.width = options.width;
    this.height = options.height;
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
                                start: start}));
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
    }
    if (can_move) {
        this.hero.square.remove(this.hero);
        this.hero.square = new_position;
        this.hero.square.add(this.hero);
        this.currentLevel.updateVisibility(this.hero.square);
    }
    this.context.refresh();
};

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

Dungeon.prototype.exit = function() {
    if (! this.hero) { this.hero = this.context.hero; }
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
    if (this.levelIndex < 0) { this.context.town(); return; }
    this.currentLevel = this.levels[this.levelIndex];
    window.level = this.currentLevel;
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


function Screen(options) {
    this.height = options.height;
    this.width = options.width;
    this.id = options.id;
    this.element = document.createElement("div");
    this.element.setAttribute("id", this.id);
    if (options.content) {
        this.element.innerHTML = options.content;
    }
}


var context = null;
function init() {
    context = new Context({element: document.createElement("div"),
                           height: 25,
                           width: 50});
    document.getElementById("context").appendChild(context.element);
    document.onkeypress = context.handleInput;
    context.add_message("Initialization complete!");
    context.refresh();
}

var helpText = "\n" +
    "    \n" +
    "    Crawl the dungeon the find the lozenge of power!  It looks like this:" +
    " <span class='item treasure'>\u22c4</span>\n" +
    "    \n" +
    "    To move in eight directions:\n" +
    "      <strong>u</strong>  <strong>i</strong>  <strong>o</strong>\n" +
    "      <strong>j</strong>     <strong>l</strong>\n" +
    "      <strong>m</strong>  <strong>,</strong>  <strong>.</strong>\n" +
    "    \n" +
    "    To attack, stand next to a monster and move into its square!\n" +
    "    \n" +
    "    Chests (<span class='item'>\u2709</span>) and Piles" +
    " (<span class='item'>\u2234</span>) hold gold or better equipment!\n" +
    "    \n" +
    "    To use whatever you're on: <strong>k</strong>!\n" +
    "    \n" +
    "    Stairs up (<span class='stairs'>\u2191</span>) and down (<span " +
    "class='stairs'>\u2193</span>) carry you between levels!\n" +
    "    \n" +
    "    Messages:\n" +
    "      <strong>y</strong>  To scroll down\n" +
    "      <strong>h</strong>  To scroll up\n" +
    "      <strong>n</strong>  To delete the current message\n" +
    "    \n" +
    "    <strong>?</strong>  To go back to the dungeon\n" +
    "\n";
