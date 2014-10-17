function Square(options)
{
    this.x = options.x;
    this.y = options.y;
    this.visibility = 0;
    this.entity = options.entity || wall;
    this.level = options.level;
    this._span = undefined;
    this._classes = this.entity[1].slice() || [];
}

Square.prototype.add = function(entity) {
    if (! this.previous) { this.previous = []; }
    this.previous.push(this.entity);
    if (this.entity[1]) {
        for (var ii = 0; ii < this.entity[1].length; ++ii) {
            this.removeClass(this.entity[1][ii]);
        }
    }
    this.entity = entity;
    classes = typeof(this.entity[1]) === "string" ? [this.entity[1]] : this.entity[1];
    if (classes) {
        for (var kk = 0; kk < classes.length; ++kk) {
            this.addClass(classes[kk]);
        }
    }
    this.span().innerHTML = entity[0];
};

Square.prototype.remove = function(entity) {
    if (! this.previous) { return; }
    classes = typeof(this.entity[1]) === "string" ? [this.entity[1]] : this.entity[1];
    if (classes) {
        for (var ii = 0; ii < classes.length; ++ii) {
            this.removeClass(classes[ii]);
        }
    }
    this.entity = this.previous.pop();
    if (this.entity === undefined) { return; }
    classes = typeof(this.entity[1]) === "string" ? [this.entity[1]] : this.entity[1];
    if (classes) {
        for (var kk = 0; kk < classes.length; ++kk) {
            this.addClass(classes[kk]);
        }
    }
    this.span().innerHTML = this.entity[0];
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
        this._span.innerHTML = this.entity[0];
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

function Level(options)
{
    this.width = options.width;
    this.height = options.height;
    this.level = options.level;
    this.start = options.start;
    this.element = document.createElement("div");
    this.grid = [];
    this.available = {};
    this.open = [];

    var total = options.height * options.width, y = 0;
    for (var ii = 0; ii < total; ++ii) {
        if (ii < options.width) { this.grid[ii] = []; }
        var x = ii % options.width;
        this.grid[x].push(new Square({x: x, y: y, entity: wall, level: this}));
        this.element.appendChild(this.grid[x][y].span());
        if (x + 1 === this.width) {
            this.element.appendChild(document.createElement("br"));
            ++y;
        }
    }
    // Give each square a cardinal direction reference to its neighbours
    for (var xx = 0; xx < this.width; ++xx) {
        for (var yy = 0; yy < this.height; ++yy) {
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
        num_rooms = 1;
    this.addRoom(this.entry, params.dir, params.lat, params.lng);
    for (var ii = 0; ii < max_attempts && num_rooms < max_rooms; ++ii) {
        var keys = Object.keys(this.available),
            available = this.available[keys[this.random(0, keys.length)]],
            door = available.wall,
            dir = available.dir;
        params = this.getRoomParameters();
        if (this.addRoom(door, dir, params.lat, params.lng)) { ++num_rooms; }
    }
    this.entry = this.grid[this.entry.x][this.entry.y];
    this.entry.add(up);
    this.exit = this.choice.apply(this, this.open).split(",");
    this.exit = this.grid[this.exit[0]][this.exit[1]];
    this.exit.add(down);
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
            latp = room[cdir][cdir];
        if (latp.isOkForRoom(dir, cdir, rdir)) {
            room[cdir] = latp;
            room[dir + cdir] = latp;
        } else {
            if ((ii = choices.indexOf(cdir)) > -1) { choices.splice(ii, 1); }
        }
    }
    var width = room[lat_choices[1]][lat_axis] - room[lat_choices[0]][lat_axis];
    if (width + 1 < lat.min) { return false; }
    loop: for (kk = 1; kk < lng.max; ++kk) {
        var cdir = lat_choices[1];    // jshint ignore:line
        if (room[lat_choices[0]][dir].isOkForRoom(dir, cdir, lat_choices[0])) {
            room[cdir] = room[lat_choices[0]] = room[lat_choices[0]][dir];
            for (ii = 0; ii < width; ++ii) {
                if (! room[cdir][cdir].isOkForRoom(dir, cdir)) { break loop; }
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
            this.set(new Square({x: xx, y: yy, entity: floor, level: this}));
            this.open.push(xx + "," + yy);
        }
    }
    this.set(new Square({x: door.x, y: door.y, entity: floor, level: this}));

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

Level.prototype.set = function(square) {
    var old = this.grid[square.x][square.y].span();
    this.grid[square.x][square.y] = square;
    this.element.replaceChild(square.span(), old);
    for (var dir in Square.prototype.cardinals) {
        try {
            var nx = square.x + Square.prototype.cardinals[dir][0],
                ny = square.y + Square.prototype.cardinals[dir][1];
            square[dir] = this.grid[nx][ny];
            this.grid[nx][ny][Square.prototype.reverse[dir]] = square;
        } catch(err) { square[dir] = undefined; }
    }
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


function Dungeon(options)
{
    this.width = options.width;
    this.height = options.height;
    this.levels = [];
    this.currentLevel = undefined;
    this.levelIndex = undefined;
    this.monitor = options.monitor;
    this.hero = this.monitor.hero;
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
Dungeon.prototype.move = function(direction)
{
    if (this.hero === undefined) { this.hero = this.monitor.hero; }
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
        this.hero.square.remove(this.hero.entity);
        this.hero.square = new_position;
        this.hero.square.add(this.hero.entity);
        this.currentLevel.updateVisibility(this.hero.square);
    }
    this.monitor.refresh();
};

Dungeon.prototype.exit = function() {
    if (! this.hero) { this.hero = this.monitor.hero; }
    var loc = "entry";
    if (this.hero.square.x === this.currentLevel.entry.x &&
        this.hero.square.y === this.currentLevel.entry.y) {
        --this.levelIndex;
        this.hero.square.remove(this.hero.entity);
        loc = "exit";
    } else if (this.hero.square.x === this.currentLevel.exit.x &&
               this.hero.square.y === this.currentLevel.exit.y) {
        if (this.levelIndex == this.levels.length - 1) {
            this.addLevel({x: this.hero.square.x, y: this.hero.square.y});
        }
        ++this.levelIndex;
        this.hero.square.remove(this.hero.entity);
    } else {
        return;
    }
    if (this.levelIndex < 0) { this.monitor.town(); return; }
    this.currentLevel = this.levels[this.levelIndex];
    for (var ii = 0; ii < this.levels.length; ++ii) {
        if (ii === this.levelIndex) { continue; }
        this.levels[ii].element.style.display = "none";
    }
    this.currentLevel.element.style.display = "block";
    this.hero.square = this.currentLevel.grid[this.currentLevel[loc].x]
                                             [this.currentLevel[loc].y];
    this.hero.square.add(this.hero.entity);
    this.currentLevel.updateVisibility(this.hero.square);
};

function Screen(options)
{
    this.height = options.height;
    this.width = options.width;
    this.id = options.id;
    this.element = document.createElement("div");
    this.element.setAttribute("id", this.id);
}


function Monitor(options)
{
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
                                monitor: this});
    this.element.appendChild(this.dungeon_screen.element);
    this.dungeon.addLevel({x: Math.floor(this.width / 2),
                           y: Math.floor(this.height / 2)},
                          this.dungeon_screen.element);
    this.hero = {hp: 10,
                 entity: ['\u00a1', 'hero'],
                 square: this.dungeon.currentLevel.grid[Math.floor(this.width / 2)]
                                                       [Math.floor(this.height / 2)]};
    this.hero.square.add(this.hero.entity);
    this.dungeon.currentLevel.updateVisibility(this.hero.square);

    this.status_bar = document.createElement("div");
    this.element.appendChild(this.status_bar);

    this.message_bar = document.createElement("div");
    this.element.appendChild(this.message_bar);
}

Monitor.prototype.refresh = function() {
    this.print_status();
    this.print_message();
};

Monitor.prototype.print_status = function() {
    this.status_bar.innerHTML = "status bar";
};

Monitor.prototype.print_message = function() {
    if (this.message_idx !== undefined) {
        this.message_bar.innerHTML = this.messages[this.message_idx];
    } else {
        this.message_bar.innerHTML = "";
    }
};

Monitor.prototype.add_message = function(message) {
    this.messages.push(message);
    if (this.message_idx === undefined) { this.message_idx = 0; }
};

Monitor.prototype.handleInput = function(event)
{
    switch (getChar(event || window.event)) {
        case "a":
        case "h":
            monitor.dungeon.move(LEFT);
            break;
        case "s":
        case "j":
            monitor.dungeon.move(DOWN);
            break;
        case "w":
        case "k":
            monitor.dungeon.move(UP);
            break;
        case "d":
        case "l":
            monitor.dungeon.move(RIGHT);
            break;
        case "u":
            monitor.dungeon.exit();
            break;
        case ",":
            if (this.message_idx + 1 <= this.messages.length) {
                ++this.message_idx;
            }
            break;
        case ".":
            if (this.message_idx - 1 >= 1) {
            --this.message_idx;
            }
            break;
        case "/":
            this.messages.splice(this.messages.length - this.message_idx, 1);
            if (this.message_idx > this.messages.length) {
                this.message_idx = this.messages.length;
            }
            break;
        default:
            //console.log(getChar(event || window.event));
            return true;
    }
    monitor.refresh();
    return false;
};

Monitor.prototype.town = function() {
};


var monitor = null;
function init()
{
    monitor = new Monitor({element: document.createElement("div"),
                           height: 25,
                           width: 50});
    document.getElementById("monitor").appendChild(monitor.element);
    document.onkeypress = monitor.handleInput;
    monitor.add_message("Initialization complete!");
    monitor.refresh();
}

var lighting = [
    [1, 2, 2, 2, 1],
    [2, 3, 3, 3, 2],
    [2, 3, 3, 3, 2],
    [2, 3, 3, 3, 2],
    [1, 2, 2, 2, 1]
];
var lights = ["pitch", "dark", "dim", ""];
function update_visibility(position) {
    for (var xx = -2; xx <= 2; ++xx) {
        var nx = position.x + xx;
        if (nx < 0 || nx >= monitor.width) { continue; }
        for (var yy = -2; yy <= 2; ++yy) {
            var ny = position.y + yy;
            if (ny < 0 || ny >= monitor.height) { continue; }
               if (lighting[xx + 2][yy + 2] > grid[nx][ny].dataset.visibility) {
                    grid[nx][ny].dataset.visibility = lighting[xx + 2][yy + 2];
                    fixVisibilityClass(nx, ny);
               }
        }
    }
}

function fixVisibilityClass(x, y) {
    var classes = grid[x][y].className.split(" ");
    for (var ii = 0; ii < lights.length; ++ii) {
        var index = classes.indexOf(lights[ii]);
        if (index > -1) {
            classes.splice(index, 1);
        }
    }
    classes.push(lights[grid[x][y].dataset.visibility]);
    grid[x][y].className = classes.join(" ");
}


function getChar(event)
{
    if (event.which === null) {
        return String.fromCharCode(event.keyCode);  // IE
    } else if (event.which !== 0 && event.charCode !== 0) {
        return String.fromCharCode(event.which);   // the rest
    } else {
        return null;  // special key
    }
}

