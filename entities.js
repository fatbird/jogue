function Mob(properties, options) {
    this.html = '';
    this.classes = ['mob'];
    this.hp = 0;
    this.inventory = [];
    this.equipped = undefined;
    this.worn = undefined;
    this.gold = 0;
    this.level = 1;

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
        if (this.equipped instanceof Array) {
            this.equipped = new window[this.equipped.choice()]();
            this.equipped.level = this.level;
            this.equipped.damage *= this.level;
        }
    };
}

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
        if (this.damage) { this.damage *= this.level; }
        if (this.armor) { this.armor *= this.level; }
        if (this.name && (this.damage || this.armor)) {
            this.name = "{0} ({1})".format(this.name, (this.damage || this.armor));
        }
    };
}

var mobs  = {
        Bard:     {html: '\u266a', equipped: ["Dagger", "Sword"]},
        Snake:    {html: '\u2621', equipped: ["Fang"]},
        Skull:    {html: '\u2620', equipped: ["Tooth"]},
        Bishop:   {html: '\u2657', equipped: ["Mitre", "Dagger"]},
        Hippie:   {html: '\u2672', equipped: ["Bong"]},
        Dwarf:    {html: '\u2692', equipped: ["Pick", "Sword"]},
        Cuberoot: {html: '\u221b', equipped: ["Modulo"]},
        Empty:    {html: '\u2205', equipped: ["Void"]}
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

        Tunic:   {armor: 1},
        Leather: {armor: 2},
        Studded: {armor: 3},
        Scale:   {armor: 4},
        Chain:   {armor: 5},

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

