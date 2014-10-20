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
        this.levelIndex = 0;
    }
};

var LEFT = 0, UP = 1, RIGHT = 2, DOWN = 3, X = 0, Y = 1;
Dungeon.prototype.move = function(direction) {
    if (this.hero === undefined) { this.hero = this.context.hero; }
    var new_position = {x: this.hero.square.x, y: this.hero.square.y};
    allowed = false;
    switch(direction) {
        case LEFT:
            new_position.x -= 1;
            break;
        case RIGHT:
            new_position.x += 1;
            break;
        case UP:
            new_position.y -= 1;
            break;
        case DOWN:
            new_position.y += 1;
            break;
    }
    new_position = this.currentLevel.grid[new_position.x][new_position.y];
    if (this.currentLevel.isAllowed(new_position)) {
        this.hero.square.remove(this.hero);
        this.hero.square = new_position;
        this.hero.square.add(this.hero);
        this.currentLevel.updateVisibility(this.hero.square);
    }
    this.context.refresh();
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


