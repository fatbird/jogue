var hero  = {html: 'I', classes: ['hero'], instance: {hp: 10, inventory: []}},

    mobs  = {
        bard:     {html: '\u266a', classes: ['mob']},
        snake:    {html: '\u2621', classes: ['mob']},
        skull:    {html: '\u2620', classes: ['mob']},
        bishop:   {html: '\u2657', classes: ['mob']},
        hippie:   {html: '\u2672', classes: ['mob']},
        dwarf:    {html: '\u2692', classes: ['mob']},
        cuberoot: {html: '\u221b', classes: ['mob']},
        empty:    {html: '\u2205', classes: ['mob']}
    },

    items = {
        dagger:  {name: 'dagger', damage: 4},
        sword:   {name: 'sword', damage: 8},

        tunic:   {name: 'tunic', armor: 1},
        leather: {name: 'leather', armor: 2},
        chain:   {name: 'chain', armor: 3},

        chest: {html: '\u2709', classes: ['item']},
        pile:  {html: '\u2234', classes: ['item', 'bold']}
    },

    wall  = {html: ' ', classes: ['wall']},
    floor = {html: '\u203b', classes: ['floor']},
    up    = {html: '\u2191', classes: ['stairs']},
    down  = {html: '\u2193', classes: ['stairs']},

    none = null
;
