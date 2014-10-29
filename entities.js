function Mob(properties, options) {
    this.html = '';
    this.classes = ['mob'];
    this.hp = 0;
    this.inventory = [];
    this.equipped = undefined;
    this.worn = undefined;
    this.gold = 0;
    this.level = 1;
    this.square = undefined;
    this._aware = false;
    this._focused = false;

    properties = properties || {};
    options = options || {};
    for (var attr in properties) { this[attr] = properties[attr]; }
    for (var opt in options) { this[opt] = options[opt]; }

    this.setup = function() {
        for (var ii = 0; ii < this.level; ++ii) {
            this.hp += random(5, 10);
            this.gold += random(0, 10);
        }
        this.max_hp = this.hp;
        ["equipped", "has", "worn", "borne"].forEach(function(property) {
            if (this[property] instanceof Array) {
                var choice = this[property].choice();
                this[property] = new window[choice]({level: this.level});
            }
        }, this);
    };

}

/**
 * Focus means the mob is focused on killing the hero.  Focus is only reset
 * when the hero leaves the level.
 */
Mob.prototype.focused = function(set) {
    if (set !== undefined) {
        this._focused = !! set;
        this._aware = !! set;
        if (this._focused) {
            this.square.addClass(["focused"]);
            this.square.removeClass(["aware"]);
        }
        else { this.square.removeClass(["focused"]); }
    }
    return this._focused;
};

/**
 * Awareness means the mob is weakly focused on killing the hero.  If the mob
 * is focused, the mob is aware and its awareness is not reset; if the mob is
 * not focused, awareness is reset by the hero running away.
 */
Mob.prototype.aware = function(set) {
    if (set !== undefined && ! this._focused) {
        this._aware = !! set;
        if (this._aware) { this.square.addClass("aware"); }
        else { this.square.removeClass("aware"); }
    }
    return this._aware;
};

Mob.prototype.reset = function(resetFocus) {
    if (resetFocus !== undefined) { this._focused = !! resetFocus; }
    this.aware(false);
};

function Item(properties, options) {
    this.html = '';
    this.classes = ['item'];
    this.contains = [];
    this.consumable = false;
    this.carryable = true;
    this.level = 1;

    properties = properties || {};
    options = options || {};
    for (var attr in properties) { this[attr] = properties[attr]; }
    for (var opt in options) { this[opt] = options[opt]; }

    this.setup = function() {
        if (this.damage) {
            this.damage = (this.damage - random(0, this.damage / 2)) * this.level;
        }
        if (this.armor) {
            this.armor = (this.armor - random(0, this.armor / 2)) * this.level;
        }
        if (this.name && (this.damage || this.armor)) {
            this.name = "{0} ({1})".format(this.name, (this.damage || this.armor));
        }
    };
}

var mobs  = {
        Bard:     {html: '\u266a',
                   equipped: ["Dagger", "Sword"],
                   worn: ["Tunic", "Leather"]},
        Snake:    {html: '\u2621', has: ["Fang"]},
        Skull:    {html: '\u2620', has: ["Tooth"], borne: ["Bone"]},
        Bishop:   {html: '\u2657',
                   equipped: ["Mitre", "Dagger"],
                   worn: ["Tunic"]},
        Dwarf:    {html: '\u2692',
                   equipped: ["Pick", "Sword"],
                   worn: ["Studded", "Scale", "Chain", "Plate"]},
        Cuberoot: {html: '\u221b', equipped: ["Modulo"],
                   borne: ["Indivisibility"]},
        Empty:    {html: '\u2205', has: ["Void"], borne: ["Haze"]}
    },
    hero = {html: 'I', },

    items = {
        Dagger:  {damage: 4},
        Sword:   {damage: 8},
        Mitre:   {damage: 10},
        Fang:    {damage: 3},
        Bong:    {damage: 5},
        Pick:    {damage: 7},
        Void:    {damage: 12},
        Modulo:  {damage: 8},
        Tooth:   {damage: 1},

        Tunic:          {armor: 1},
        Leather:        {armor: 2},
        Bone:           {armor: 2},
        Studded:        {armor: 3},
        Haze:           {armor: 3},
        Scale:          {armor: 4},
        Chain:          {armor: 5},
        Plate:          {armor: 8},
        Indivisibility: {armor: 4},

        Gold:    {amount: 0},

        Chest:   {html: '\u2709', consumable: true, carryable: false},
        Pile:    {html: '\u2234', consumable: true, carryable: false}
    },

    wall  = {html: ' ', classes: ['wall']},
    floor = {html: '\u203b', classes: ['floor']},
    up    = {html: '\u2191', classes: ['stairs']},
    down  = {html: '\u2193', classes: ['stairs']},

    none = null
;

/**
 * Create a class of each mob described above
 */
function makeClass(Prototype, type, properties) {
    window[type] = function(options) {
        Prototype.call(this, properties, options);
        this.kind = type.toLowerCase();
        this.name = type;
        this.classes.push(type.toLowerCase());
        if (this.setup) { this.setup(); }
    };
    window[type].prototype = new Prototype();
    window[type].constructor = window[type];
}

for (var type in items) { makeClass(Item, type, items[type]); }
for (var type in mobs) { makeClass(Mob, type, mobs[type]); }
makeClass(Mob, "Hero", hero);

