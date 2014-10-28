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
        max_mobs = 20,
        max_items = 4,
        mob, item, loc, xy;
    this.addRoom(this.entry, params.dir, params.lat, params.lng);
    for (var ii = 0; ii < max_attempts && num_rooms < max_rooms; ++ii) {
        var keys = Object.keys(this.available),
            available = this.available[keys.choice()],
            door = available.wall,
            dir = available.dir;
        params = this.getRoomParameters();
        if (this.addRoom(door, dir, params.lat, params.lng)) { ++num_rooms; }
    }

    // add entry and exit
    this.entry = this.grid[this.entry.x][this.entry.y];
    this.entry.add(up);
    this.open.remove(this.entry.id());
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
        item = this.generateItem(["Chest", "Pile"].choice());
        xy = this.open.draw().split(",");
        this.items.push(item);
        this.grid[xy[0]][xy[1]].add(item);
    }
};

Level.prototype.generateMob = function() {
    var type = Object.keys(mobs).choice(),
        mob = new window[type]();
//    if (mob.setup) { mob.setup(); }
    return mob;
};

Level.prototype.generateItem = function() {
    var type = arguments[0] || Object.keys(items).choice(),
        item = new window[type]();
    if (item.consumable && ! item.carryable) {  // chest or pile
        if ([true, false, item.name === "Chest", item.name === "Chest"].choice()) {
            var gold = new Gold({amount: this.random(0, 10) * this.level });
            if (gold.amount > 0) { item.contains.push(gold); }
        }
        if ([true, false, item.name === "Chest"].choice()) {
            var obj = this.generateItem();
            if (obj !== Gold) { item.contains.push(this.generateItem()); }
        }
    }
    if (item.setup) { item.setup(); }
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
        var cdir = choices.choice(),
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



