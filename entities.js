function Mob(properties, options) {
    this.html = '';
    this.classes = ['mob'];
    this.hp = 0;
    this.inventory = [];
    this.equipped = undefined;
    this.worn = undefined;
    this.gold = 0;

    properties = properties || {};
    options = options || {};
    for (var attr in properties) { this[attr] = properties[attr]; }
    for (var opt in options) { this[opt] = options[opt]; }

    this.setup = function() {
        this.gold = Level.prototype.random(0, 10);
        this.hp = Level.prototype.random(5, 10);
    };
}

function Item(properties, options) {
    this.html = '';
    this.classes = ['item'];
    this.contains = [];
    this.consumable = false;
    this.carryable = true;

    properties = properties || {};
    options = options || {};
    for (var attr in properties) { this[attr] = properties[attr]; }
    for (var opt in options) { this[opt] = options[opt]; }
}

var mobs  = {
        Bard:     {html: '\u266a', },
        Snake:    {html: '\u2621', },
        Skull:    {html: '\u2620', },
        Bishop:   {html: '\u2657', },
        Hippie:   {html: '\u2672', },
        Dwarf:    {html: '\u2692', },
        Cuberoot: {html: '\u221b', },
        Empty:    {html: '\u2205', }
    },
    hero = {html: 'I', },

    items = {
        Dagger:  {damage: 4},
        Sword:   {damage: 8},

        Tunic:   {armor: 1},
        Leather: {armor: 2},
        Chain:   {armor: 3},

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
        this.name = type;
        this.classes.push(type.toLowerCase());
    };
    window[type].prototype = new Prototype();
    window[type].constructor = window[type];
    if (this.setup) { this.setup(); }
}

for (var type in items) { makeClass(Item, type, items[type]); }
for (var type in mobs) { makeClass(Mob, type, mobs[type]); }
makeClass(Mob, "Hero", hero);

