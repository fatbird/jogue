function Context(options) {
    this.element = options.element;
    this.height = options.height;
    this.width = options.width;
    this.messages = [];
    this.message_idx = undefined;
    this.dungeonScreen = new Screen({width: this.width,
                                      height: this.height,
                                      id: "dungeon-screen"});
    this.currentScreen = this.dungeonScreen;
    this.dungeon = new Dungeon({width: this.width,
                                height: this.height,
                                context: this});
    this.element.appendChild(this.dungeonScreen.element);
    this.dungeon.addLevel({x: Math.floor(this.width / 2),
                           y: Math.floor(this.height / 2)},
                          this.dungeonScreen.element);
    this.hero = new Hero();
    this.hero.square = this.dungeon.currentLevel.grid[Math.floor(this.width/2)]
                                                     [Math.floor(this.height/2)];
    this.hero.square.add(this.hero);
    this.hero.inventory.push(Object.create(new Dagger()));
    this.hero.equipped = this.hero.inventory.last();
    this.hero.inventory.push(Object.create(new Tunic()));
    this.hero.worn = this.hero.inventory.last();
    this.dungeon.currentLevel.updateVisibility(this.hero.square);
    this.dungeon.hero = this.hero;

    this.helpScreen = new Screen({width: this.width, height: this.height,
                                  id: "help-screen", content: helpText});
    this.helpScreen.element.style.display = "none";
    this.element.appendChild(this.helpScreen.element);

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
        status = "HP: {0} E: {1} W: {2} G: {3}  Level: {4}           ? for help"
                 .replace("{0}", String(this.hero.hp).rpad(4, "data"))
                 .replace("{1}", String(this.hero.equipped).rpad(12, "data"))
                 .replace("{2}", String(this.hero.worn).rpad(12, "data"))
                 .replace("{3}", String(this.hero.gold).rpad(4, "data"))
                 .replace("{4}", String(this.dungeon.levelIndex + 1).lpad(2, "data"));
    this.status_bar.innerHTML = status;
};

var msg_classes = ["first", "second", "third"];
Context.prototype.print_message = function() {
    var messages = '';
    for (var ii = 0; ii < 3; ++ii) {
        if (this.messages[ii + this.message_idx]) {
            messages += "<div class='" + msg_classes[ii] + "'>" +
                        this.messages[ii + this.message_idx] + "</span>";
        }
    }
    this.message_bar.innerHTML = messages;
};

Context.prototype.add_message = function(message) {
    this.messages.unshift(message);
    if (! this.message_idx) { this.message_idx = 0; }
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
        if (context.currentScreen === context.dungeonScreen) {
            context.dungeon.move(key);
        }
        break;
    case "k":  // "use" object in current square
        if (context.currentScreen === context.dungeonScreen) {
            context.dungeon.activate();
        }
        break;
    case "h":  // scrolling messages up i.e., back through earlier messages
        if (context.message_idx + 1 < context.messages.length) {
            ++context.message_idx;
        }
        break;
    case "y":  // scrolling messages down i.e., to latest messages
        if (context.message_idx > 0) { --context.message_idx; }
        break;
    case "n":  // delete current messages
        context.messages.splice(context.message_idx, 1);
        context.message_idx = Math.min(context.message_idx,
                                       context.messages.length - 1);
        break;
    case "?":
        if (context.currentScreen === context.helpScreen) {
            context.currentScreen = context.dungeonScreen;
            context.helpScreen.element.style.display = "none";
        } else {
            context.currentScreen = context.helpScreen;
            context.dungeonScreen.element.style.display = "none";
        }
        context.currentScreen.element.style.display = "block";
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



