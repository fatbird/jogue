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


function Square(options) {
    this.x = options.x;
    this.y = options.y;
    this.visibility = 3;
    this.entity = options.entity || wall;
    this.level = options.level;
    this._span = undefined;
    this._classes = ['grid'].concat(this.entity.classes || []);
    this._previous = [];
}

Square.prototype.add = function(entity) {
    this._previous.push(this.entity);
    this.entity.classes.forEach(function(cls) { this.removeClass(cls); }, this);
    this.entity = entity;
    this.entity.classes.forEach(function(cls) { this.addClass(cls); }, this);
    this.span().innerHTML = entity.html;
};

Square.prototype.remove = function(entity) {
    this.entity.classes.forEach(function(cls) { this.removeClass(cls); }, this);
    this.entity = this._previous.pop();
    this.entity.classes.forEach(function(cls) { this.addClass(cls); }, this);
    this.span().innerHTML = this.entity.html;
};

Square.prototype.cardinals = {"nw": [-1, -1], "n": [0, -1], "ne": [1, -1],
                              "e": [1, 0], "se": [1, 1], "s": [0, 1],
                              "sw": [-1, 1], "w": [-1, 0]};
Square.prototype.reverse = {"nw": "se", "n": "s", "ne": "sw", "e": "w",
                            "se": "nw", "s": "n", "sw": "ne", "w": "e"};
Square.prototype.lighting = ["pitch", "dark", "dim", "visible"];

Square.prototype.span = function() {
    if (this._span === undefined) {
        this._span = document.createElement("span");
        this._span.setAttribute("id", this.x + "," + this.y);
        this._span.innerHTML = this.entity.html;
        this._classes.push(this.lighting[this.visibility]);
        this._span.className = this._classes.join(" ");
    }
    return this._span;
};

Square.prototype.updateVisibility = function(level) {
    if (level > this.visibility) {
        this.removeClass(this.lighting[this.visibility]);
        this.visibility = level;
        this.addClass(this.lighting[this.visibility]);
    }
};

Square.prototype.addClass = function(cls) {
    if (this._classes.indexOf(cls) === -1) {
        this._classes.push(cls);
        this.span().className = this._classes.join(" ");
    }
};

Square.prototype.removeClass = function(cls) {
    if ((ii = this._classes.indexOf(cls)) > -1) {
        this._classes.splice(ii, 1);
        this.span().className = this._classes.join(" ");
    }
};

Square.prototype.getOpenAdjacent = function() {
    var adj = [];
    if (this.n && this.n.entity != wall) {
        adj.push({x: this.n.x, y: this.n.y, dir: "n"});
    }
    if (this.e && this.e.entity != wall) {
        adj.push({x: this.e.x, y: this.e.y, dir: "e"});
    }
    if (this.s && this.s.entity != wall) {
        adj.push({x: this.s.x, y: this.s.y, dir: "s"});
    }
    if (this.w && this.w.entity != wall) {
        adj.push({x: this.w.x, y: this.w.y, dir: "w"});
    }
    return adj;
};

Square.prototype.isOkForRoom = function() {
    for (var ii = 0; ii < arguments.length; ++ii) {
        if (! this[arguments[ii]] || this[arguments[ii]].entity !== wall) {
            return false;
        }
    }
    return true;
};

Square.prototype.markAvailableWalls = function(dir) {
    var contender = this[dir],
        cursor = this[dir],
        id = contender.span().getAttribute("id"),
        dz, l, r;
    if (dir === "n") { dz = -1; l = "w"; r = "e"; }
    else if (dir === "s") { dz = 1; l = "e"; r = "w"; }
    else if (dir === "w") { dz = -1; l = "s"; r = "n"; }
    else { dz = 1; l = "n"; r = "s"; }
    for (var ii = 0; ii < 3 && contender && cursor; ++ii) {
        if (! (cursor && cursor.entity === wall &&
               cursor[l] && cursor[l].entity === wall &&
               cursor[r] && cursor[r].entity === wall &&
               cursor[dir])) {
            //contender.removeClass("available");
            delete this.level.available[id];
            return false;
        }
        cursor = cursor[dir];
    }
    this.level.available[id] = {wall: contender, dir: dir};
    //contender.addClass("available");
    return true;
};

Square.prototype.getId = function() { return this.x + "," + this.y; };


function Level(options) {
    this.width = options.width;
    this.height = options.height;
    this.level = options.level;
    this.start = options.start;
    this.element = document.createElement("div");
    this.grid = [];
    this.available = {};
    this.open = [];
    this.mobs = [];
    this.items = [];

    var xx, yy, row;
    for (yy = 0; yy < this.height; ++yy) {
        row = document.createElement("div");
        row.className = "row";
        for (xx = 0; xx < this.width; ++xx) {
            if (! this.grid[xx]) { this.grid[xx] = []; }
            this.grid[xx].push(new Square({x: xx, y: yy, level: this}));
            row.appendChild(this.grid[xx][yy].span());
        }
        this.element.appendChild(row);
    }
    // Give each square a cardinal direction reference to its neighbours
    for (xx = 0; xx < this.width; ++xx) {
        for (yy = 0; yy < this.height; ++yy) {
            for (var dir in Square.prototype.cardinals) {
                try {
                    var nx = xx + Square.prototype.cardinals[dir][0],
                        ny = yy + Square.prototype.cardinals[dir][1];
                    this.grid[xx][yy][dir] = this.grid[nx][ny];
                } catch(err) { this.grid[xx][yy][dir] = undefined; }
            }
        }
    }
}

/**
 */
Level.prototype.random = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
};

Level.prototype.choice = function() {
    return arguments[this.random(0, arguments.length)];
};

var last_choice;
Level.prototype.alternate = function() {
    if (last_choice === arguments[0] && arguments.length > 1) {
        return last_choice = arguments[1];  // jshint ignore:line
    }
    return last_choice = arguments[0];  // jshint ignore:line
};

Level.prototype.getRoomParameters = function() {
    var direction = this.choice("n", "w", "e", "s"),
        a = {min: this.random(2, 3), max: this.random(3, 8)},
        b = {min: this.random(2, 4), max: this.random(4, 12)};
    if (direction === "n" || direction === "s") {
        return {dir: direction, lat: b, lng: a};
    }
    return {dir: direction, lat: a, lng: b};
};

Level.prototype.generateLevel = function() {
    this.entry = this.grid[this.start.x][this.start.y];
    var params = this.getRoomParameters(),
        max_attempts = 60,
        max_rooms = 15,
        num_rooms = 1,
        max_mobs = 15,
        max_items = 3,
        mob, item, loc, xy;
    this.addRoom(this.entry, params.dir, params.lat, params.lng);
    for (var ii = 0; ii < max_attempts && num_rooms < max_rooms; ++ii) {
        var keys = Object.keys(this.available),
            available = this.available[keys[this.random(0, keys.length)]],
            door = available.wall,
            dir = available.dir;
        params = this.getRoomParameters();
        if (this.addRoom(door, dir, params.lat, params.lng)) { ++num_rooms; }
    }

    // add entry and exit
    this.entry = this.grid[this.entry.x][this.entry.y];
    this.entry.add(up);
    this.open.remove(this.entry.getId());
    this.exit = this.choice.apply(this, this.open).split(",");
    this.exit = this.grid[this.exit[0]][this.exit[1]];
    this.exit.add(down);

    // add mobs
    for (var kk = 0; kk < max_mobs; ++kk) {
        mob = this.generateMob();
        xy = this.open.draw().split(",");
        this.mobs.push(mob);
        this.grid[xy[0]][xy[1]].add(mob);
    }

    // add items
    for (var ll = 0; ll < max_items; ++ll) {
        item = this.generateItem();
        xy = this.open.draw().split(",");
        this.items.push(item);
        this.grid[xy[0]][xy[1]].add(item);
    }
};

Level.prototype.generateMob = function() {
    var type = Object.keys(mobs).choice(),
        mob = Object.create(mobs[type]);
    mob.hp = 10;
    mob.classes.push(type);
    return mob;
};

Level.prototype.generateItem = function() {
    var type = arguments[0] || Object.keys(items).choice(),
        item = Object.create(items[type]);
    return item;
};

Level.prototype.addRoom = function(door, dir, lat, lng) {
    /**
     * The meat of dungeon generation: this algorithm finds an available wall,
     * adds a door to it, then tries to carve out a room at least min height
     * and width and at most max height and width.  The direction in which the
     * carver is facing (i.e., in which wall of the existing room the door is)
     * is the longitudinal axis of the new room (lng* variables, below; lat*
     * are lateral equivalents).  The carver digs laterally to max_lat,
     * randomly alternating between left and right for the first row, and then
     * advances along the longitudinal axis and and carves laterally to the
     * left/right boundaries established in the first row.
     *
     * If at any time, the carver cannot continue because the possible square
     * doesn't have wall in the next square laterally and longitudinally, room
     * generation stops and min_* values are checked.  If the room is big
     * enough, it's committed; otherwise it's abandoned.
     */

    var lat_choices = (dir === "n" || dir === "s" ? ["w", "e"] : ["n", "s"]),
        choices = lat_choices.slice(),
        lng_choices = (dir === "n" || dir === "s" ? ["n", "s"] : ["w", "e"]),
        lng_axis = (dir === "n" || dir === "s" ? "y" : "x"),
        lat_axis = (dir === "n" || dir === "s" ? "x" : "y"),
        dz = (dir === "n" || dir === "w" ? -1 : 1),
        rdir = Square.prototype.reverse[dir],
        ldir = lat_choices[Number(dz === 1)],
        nw = dir + ldir,
        se = dir + lat_choices[Number(dz === -1)],
        room = {};
    for (ii = 0; ii < lat_choices.length; ++ii) {
        room[lat_choices[ii]] = door[dir];
        room[lng_choices[ii]] = door[dir];
        room[nw] = door[dir];
        room[se] = door[dir];
    }

    for (ii = 0; ii < lat.max - 1 && choices.length > 0; ++ii) {
        var cdir = this.choice.apply(this, choices),
            latp = room[cdir][cdir],
            cpdir = ["n", "s"].indexOf(dir) > -1 ? dir + cdir : cdir + dir;
        if (latp.isOkForRoom(dir, cdir, rdir, cpdir)) {
            room[cdir] = latp;
            room[dir + cdir] = latp;
        } else {
            if ((ii = choices.indexOf(cdir)) > -1) { choices.splice(ii, 1); }
        }
    }
    var width = room[lat_choices[1]][lat_axis] - room[lat_choices[0]][lat_axis];
    if (width + 1 < lat.min) { return false; }
    loop: for (kk = 1; kk < lng.max; ++kk) {
        var cdir = lat_choices[1],   // jshint ignore:line
            dirs = [dir, cdir];
        if (room[lat_choices[0]][dir].isOkForRoom(dir, cdir, lat_choices[0])) {
            if (["n", "s"].indexOf(dir) > -1) {
                dirs.push(dir + lat_choices[0]);
                dirs.push(dir + lat_choices[1]);
            } else {
                dirs.push(lat_choices[0] + dir);
                dirs.push(lat_choices[1] + dir);
            }
            var xdir = ["n", "s"].indexOf(dir) > -1 ? dir + cdir : cdir + dir;
            room[cdir] = room[lat_choices[0]] = room[lat_choices[0]][dir];
            for (ii = 0; ii < width; ++ii) {
                if (! room[cdir][cdir].isOkForRoom.apply(dirs)) {
                    break loop;
                }
                room[cdir] = room[cdir][cdir];
            }
            room[nw] = room[ldir];
        }
    }
    if (room[nw][lat_axis] > room[se][lat_axis]) {
        room.tmp = room[nw];
        room[nw] = room[se];
        room[se] = room.tmp;
    }
    var height = room[se][lng_axis] - room[nw][lng_axis];
    if (height + 1 < lng.min) { return false; }
    for (xx = room[nw].x; xx <= room[se].x; ++xx) {
        for (yy = room[nw].y; yy <= room[se].y; ++yy) {
            this.grid[xx][yy].add(floor);
            this.open.push(xx + "," + yy);
        }
    }
    this.grid[door.x][door.y].add(floor);

    // update available walls
    for (xx = room[nw].x; xx <= room[se].x; ++xx) {
        this.grid[xx][room[nw].y].markAvailableWalls("n");
        this.grid[xx][room[se].y].markAvailableWalls("s");
    }
    for (yy = room[nw].y; yy <= room[se].y; ++yy) {
        this.grid[room[nw].x][yy].markAvailableWalls("w");
        this.grid[room[se].x][yy].markAvailableWalls("e");
    }

    return true;
};

Level.prototype.isAllowed = function(position) {
    if (position.x < 0 || position.x >= this.width) { return false; }
    if (position.y < 0 || position.y >= this.height) { return false; }
    return position.entity !== wall;
};


var visibility_grid = [
    [[1, 2], [2], [1, 2]],
    [[2], [], [2]],
    [[1, 2], [2], [1, 2]],
];
Level.prototype.updateVisibility = function(square) {
    var x = square.x, y = square.y;
    for (var yy = -1; yy <= 1; ++yy) {
        for (var xx = -1; xx <= 1; ++xx) {
            if (! this.grid[x + xx]) { continue; }
            if (! this.grid[x + xx][y + yy]) { continue; }
            this.grid[x + xx][y + yy].updateVisibility(3);
            if (this.grid[x + xx][y + yy].entity != wall) {
                var xtd = visibility_grid[xx + 1][yy + 1];
                this.grid[x + xx + xx][y + yy + yy].updateVisibility(xtd[0]);
                if (xtd.length > 1) {
                    this.grid[x + xx + xx][y + yy].updateVisibility(xtd[1]);
                    this.grid[x + xx][y + yy + yy].updateVisibility(xtd[1]);
                }
            }
        }
    }
};


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


function Context(options) {
    this.element = options.element;
    this.height = options.height;
    this.width = options.width;
    this.messages = [];
    this.message_idx = undefined;
    this.dungeon_screen = new Screen({width: this.width,
                                      height: this.height,
                                      id: "dungeon_screen"});
    this.dungeon = new Dungeon({width: this.width,
                                height: this.height,
                                context: this});
    this.element.appendChild(this.dungeon_screen.element);
    this.dungeon.addLevel({x: Math.floor(this.width / 2),
                           y: Math.floor(this.height / 2)},
                          this.dungeon_screen.element);
    this.hero = hero;
    this.hero.square = this.dungeon.currentLevel.grid[Math.floor(this.width / 2)]
                                                     [Math.floor(this.height / 2)];
    this.hero.square.add(this.hero);
    this.dungeon.currentLevel.updateVisibility(this.hero.square);

    this.status_bar = document.createElement("div");
    this.element.appendChild(this.status_bar);

    this.message_bar = document.createElement("div");
    this.element.appendChild(this.message_bar);
}

Context.prototype.refresh = function() {
    this.print_status();
    this.print_message();
};

Context.prototype.print_status = function() {
    this.status_bar.innerHTML = "status bar";
};

Context.prototype.print_message = function() {
    if (this.message_idx !== undefined) {
        this.message_bar.innerHTML = this.messages[this.message_idx];
    } else {
        this.message_bar.innerHTML = "";
    }
};

Context.prototype.add_message = function(message) {
    this.messages.push(message);
    if (this.message_idx === undefined) { this.message_idx = 0; }
};

Context.prototype.handleInput = function(event) {
    switch (Context.prototype.getChar(event || window.event)) {
        case "a":
        case "h":
            context.dungeon.move(LEFT);
            break;
        case "s":
        case "j":
            context.dungeon.move(DOWN);
            break;
        case "w":
        case "k":
            context.dungeon.move(UP);
            break;
        case "d":
        case "l":
            context.dungeon.move(RIGHT);
            break;
        case "u":
            context.dungeon.exit();
            break;
        case ",":
            if (this.message_idx + 1 <= this.messages.length) {
                ++this.message_idx;
            }
            break;
        case ".":
            if (this.message_idx - 1 >= 1) { --this.message_idx; }
            break;
        case "/":
            this.messages.splice(this.messages.length - this.message_idx, 1);
            if (this.message_idx > this.messages.length) {
                this.message_idx = this.messages.length;
            }
            break;
        default:
            //console.log(this.getChar(event || window.event));
            return true;
    }
    context.refresh();
    return false;
};

Context.prototype.town = function() {
};

Context.prototype.getChar = function(event)
{
    if (event.which === null) {
        return String.fromCharCode(event.keyCode);  // IE
    } else if (event.which !== 0 && event.charCode !== 0) {
        return String.fromCharCode(event.which);   // the rest
    } else {
        return null;  // special key
    }
};


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


