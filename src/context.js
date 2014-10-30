function Context(options) {
    this.element = options.element;
    this.height = options.height;
    this.width = options.width;
    this.messages = [];
    this.message_idx = undefined;
    this.options = options;
    this.dungeonScreen = new Screen({width: this.width,
                                      height: this.height,
                                      id: "dungeon-screen"});
    this.currentScreen = this.dungeonScreen;
    this.dungeon = new Dungeon({width: this.width,
                                height: this.height,
                                context: this});
    this.element.appendChild(this.dungeonScreen.element);
    var start = {x: Math.floor(this.width / 2), y: Math.floor(this.height / 2)};
    start = {x: random(2, this.dungeon.maxX - 2),
             y: random(2, this.dungeon.maxY - 2)};
    this.dungeon.addLevel(start, this.dungeonScreen.element);
    this.hero = new Hero();
    this.hero.square = this.dungeon.currentLevel.entry;
    this.hero.square.add(this.hero);
    this.hero.inventory.push(Object.create(new window[config.weapon]()));
    this.hero.equipped = this.hero.inventory.last();
    this.hero.inventory.push(Object.create(new window[config.armor]()));
    this.hero.worn = this.hero.inventory.last();
    this.hero.killed = 0;
    this.hero.regenerate = function() {
        if (random(0, 100) < 20 && context.hero.hp < context.hero.max_hp) {
            context.hero.hp += 1;
        }
    };
    this.dungeon.currentLevel.updateVisibility(this.hero.square);
    this.dungeon.hero = this.hero;

    this.helpScreen = new Screen({width: this.width, height: this.height,
                                  id: "help-screen", content: helpText});
    this.helpScreen.element.style.display = "none";
    this.element.appendChild(this.helpScreen.element);

    this.townScreen = new Screen({width: this.width, height: this.height,
                                  id: "town-screen", content: townText});
    this.townScreen.element.style.display = "none";
    this.element.appendChild(this.townScreen.element);

    this.gameOverScreen = new Screen({width: this.width, height: this.height,
                                      id: "game-over-screen"});
    this.gameOverScreen.element.style.display = "none";
    this.element.appendChild(this.gameOverScreen.element);

    this.lozengeScreen = new Screen({width: this.width, height: this.height,
                                     id: "lozenge-screen", content: lozengeText});
    this.lozengeScreen.element.style.display = "none";
    this.element.appendChild(this.lozengeScreen.element);

    this.victoryScreen = new Screen({width: this.width, height: this.height,
                                      id: "victory-screen"});
    this.victoryScreen.element.style.display = "none";
    this.element.appendChild(this.victoryScreen.element);

    this.blankScreen = new Screen({width: this.width, height: this.height});
    this.blankScreen.element.style.display = "none";
    this.element.appendChild(this.blankScreen.element);

    this.status_bar = document.createElement("div");
    this.status_bar.className = "status";
    this.element.appendChild(this.status_bar);

    this.message_bar = document.createElement("div");
    this.message_bar.className = "messages";
    this.element.appendChild(this.message_bar);

}

Context.prototype.showScreen = function(name) {
    this.currentScreen.element.style.display = "none";
    this.currentScreen = this[name + "Screen"];
    this.currentScreen.element.style.display = "block";
};

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
            idx = ii + this.message_idx;
            didx = this.messages.length - idx;
            messages += "<div class='" + msg_classes[ii] + "'>" +
                        (didx) + ". " + this.messages[idx] + "</span>";
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
            context.dungeon.checkMobs();
        } else {
            context.showScreen("dungeon");
        }
        break;
    case "g":  // scrolling messages up i.e., back through earlier messages
        if (context.message_idx + 1 < context.messages.length) {
            ++context.message_idx;
        }
        break;
    case "t":  // scrolling messages down i.e., to latest messages
        if (context.message_idx > 0) { --context.message_idx; }
        break;
    case "b":  // delete current messages
        context.messages.splice(context.message_idx, 1);
        context.message_idx = Math.min(context.message_idx,
                                       context.messages.length - 1);
        break;
    case "r":  // restart
        if (false && context.currentScreen === context.gameOverScreen) {
            context.showScreen("blank");
            var container = document.getElementById("context");
            document.body.removeChild(container);
            setTimeout(function() {
                context = null;
                init();
            }, 10);
        }
        break;
    case "?":
        if (context.currentScreen === context.helpScreen) {
            context.showScreen("dungeon");
        } else {
            context.showScreen("help");
        }
        break;
    default:
        return true;
    }
    if (context.currentScreen === context.dungeonScreen) {
        context.hero.regenerate();
        context.refresh();
    }
    return false;
};

Context.prototype.getChar = function(event) {
    if (event.which === null) {
        return String.fromCharCode(event.keyCode);  // IE
    } else if (event.which !== 0 && event.charCode !== 0) {
        return String.fromCharCode(event.which);   // the rest
    }
};

Context.prototype.town = function() {
    if (this.hero.has_lozenge) {
        this.victoryScreen.element.innerHTML = victoryText.format(this.hero.gold);
        this.showScreen("victory");
    } else {
        this.showScreen("town");
    }
};

