"use strict";  // jshint ignore:line
/* global Dungeon, document, random, Hero, window, config, context */

/**
 * A screen-like container for conveniently flipping screens of content
 */
function Screen(content) {
    this.element = document.createElement("div");
    this.element.className = "screen";
    this.element.style.display = "none";
    this.element.innerHTML = content || "";
}

/**
 * A gamewide context container
 */
function Context(options) {
    this.element = document.createElement("div");
    this.element.setAttribute("id", "context");
    this.height = options.height;
    this.width = options.width;
    this.messages = [];
    this.message_idx = undefined;
    this.options = options;

    this.screens = {};
    for (var name in options.screens || {}) {
        this.screens[name] = new Screen(options.screens[name]);
        this.element.appendChild(this.screens[name].element);
    }

    this.dungeon = new Dungeon({width: this.width,
                                height: this.height,
                                context: this});
    this.element.appendChild(this.screens.dungeon.element);
    this.currentScreen = this.screens.dungeon;
    var start = {x: Math.floor(this.width / 2), y: Math.floor(this.height / 2)};
    start = {x: random(2, this.dungeon.maxX - 2),
             y: random(2, this.dungeon.maxY - 2)};
    this.dungeon.addLevel(start, this.screens.dungeon.element);

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

    this.status_bar = document.createElement("div");
    this.status_bar.className = "status";
    this.element.appendChild(this.status_bar);

    this.message_bar = document.createElement("div");
    this.message_bar.className = "messages";
    this.element.appendChild(this.message_bar);

    this.showScreen("dungeon");
}

/**
 * Set the named screen to display
 */
Context.prototype.showScreen = function(name) {
    this.currentScreen.element.style.display = "none";
    this.currentScreen = this.screens[name];
    this.currentScreen.element.style.display = "block";
};

Context.prototype.refresh = function() {
    this.print_status();
    this.print_message();
};

Context.prototype.print_status = function() {
    var hero = this.hero,
        level = this.dungeon.levelIndex + 1,
        status = "HP: {0} E: {1} W: {2} G: {3}  Level: {4}           ? for help"
                 .replace("{0}", String(hero.hp).rpad(4, "data"))
                 .replace("{1}", String(hero.equipped).rpad(12, "data"))
                 .replace("{2}", String(hero.worn).rpad(12, "data"))
                 .replace("{3}", String(hero.gold).rpad(4, "data"))
                 .replace("{4}", String(level).lpad(2, "data"));
    this.status_bar.innerHTML = status;
};

var msg_classes = ["first", "second", "third"];
Context.prototype.print_message = function() {
    var messages = '';
    for (var ii = 0; ii < 3; ++ii) {
        if (this.messages[ii + this.message_idx]) {
            var idx = ii + this.message_idx,
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

/* global N, NE, E, SE, S, SW, W, NW, init */
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
        if (context.currentScreen === context.screens.dungeon) {
            context.dungeon.move(key);
        }
        break;
    case "k":  // "use" object in current square
        if (context.currentScreen === context.screens.dungeon) {
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
        if (false && context.currentScreen === context.screens.gameOver) {
            context.showScreen("blank");
            var container = document.getElementById("context");
            document.body.removeChild(container);
            window.setTimeout(function() {
                context = null;  // jshint ignore:line
                init();
            }, 10);
        }
        break;
    case "?":
        if (context.currentScreen === context.screens.help) {
            context.showScreen("dungeon");
        } else {
            context.showScreen("help");
        }
        break;
    default:
        return true;
    }
    if (context.currentScreen === context.screens.dungeon) {
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

/**
 * Placeholder for town functionality
 */
/* global victoryText */
Context.prototype.town = function() {
    if (this.hero.has_lozenge) {
        this.screens.victory.element.innerHTML = victoryText.format(this.hero.gold);
        this.showScreen("victory");
    } else {
        this.showScreen("town");
    }
};

