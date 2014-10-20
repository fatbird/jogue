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
    this.hero.instance.inventory.push(Object.create(items.dagger));
    this.hero.instance.equipped = this.hero.instance.inventory.last();
    this.hero.instance.inventory.push(Object.create(items.tunic));
    this.hero.instance.worn = this.hero.instance.inventory.last();
    this.dungeon.currentLevel.updateVisibility(this.hero.square);

    this.status_bar = document.createElement("div");
    this.status_bar.className = "status";
    this.element.appendChild(this.status_bar);

    this.message_bar = document.createElement("div");
    this.message_bar.className = "messages";
    this.element.appendChild(this.message_bar);
}

Context.prototype.refresh = function() {
    this.print_status();
    this.print_message();
};

Context.prototype.print_status = function() {
    var hero = this.hero.instance,
        status = "HP: {0} E: {1} W: {2} Level: {3}           ? for help"
                 .replace("{0}", String(hero.hp).rpad(4, "data"))
                 .replace("{1}", String(hero.equipped).rpad(12, "data"))
                 .replace("{2}", String(hero.worn).rpad(12, "data"))
                 .replace("{3}", String(this.dungeon.levelIndex + 1).lpad(2, "data"));
    this.status_bar.innerHTML = status;
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
    var key = Context.prototype.getChar(event || window.event);
    switch (key) {
    case N:
    case NE:
    case E:
    case SE:
    case S:
    case SW:
    case W:
    case NW:
        context.dungeon.move(key);
        break;
    case "f":
        context.dungeon.exit();
        break;
    case "c":
        if (this.message_idx + 1 <= this.messages.length) {
            ++this.message_idx;
        }
        break;
    case "v":
        if (this.message_idx - 1 >= 1) { --this.message_idx; }
        break;
    case "x":
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

Context.prototype.getChar = function(event) {
    if (event.which === null) {
        return String.fromCharCode(event.keyCode);  // IE
    } else if (event.which !== 0 && event.charCode !== 0) {
        return String.fromCharCode(event.which);   // the rest
    }
};



