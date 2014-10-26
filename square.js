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
    this._previous.unshift(this.entity);
    this.entity.classes.forEach(function(cls) { this.removeClass(cls); }, this);
    this.entity = entity;
    this.entity.classes.forEach(function(cls) { this.addClass(cls); }, this);
    this.span().innerHTML = entity.html;
};

Square.prototype.last = function() {
    return this._previous[0];
};

Square.prototype.remove = function(entity) {
    this.entity.classes.forEach(function(cls) { this.removeClass(cls); }, this);
    this.entity = this._previous.shift();
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

Square.prototype.id = function() { return this.x + "," + this.y; };



