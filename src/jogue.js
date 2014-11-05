"use strict";  // jshint ignore:line
/* global Context, document */

/**
 * Return a random integer within min/max bounds; if not specified, min
 * defaults to 0 and max defaults to the length of the array.
 */
Array.prototype.random = function(min, max) {
    min = min || 0;
    max = max || this.length;
    return Math.floor(Math.random() * (max - min) + min);
};

function random(min, max) {
    min = Math.floor(min || 0);
    max = Math.ceil(max || 100);
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Return a random element from the array
 */
Array.prototype.choice = function() { return this[this.random()]; };

/**
 * Remove the item if found, return boolean indicating actual removal.
 */
Array.prototype.remove = function(item) {
    var index = this.indexOf(item);
    if (index > -1) { return !! this.splice(index, 1); }
    return false;
};

/**
 * Remove and return a random element, or undefined from an empty array.
 */
Array.prototype.draw = function() {
    return this.splice(this.random(), 1)[0];
};

/**
 * Return the last element of the array
 */
Array.prototype.last = function() { return this[this.length - 1]; };


/**
 * Return the string padded with spaces on the left to the specified length;
 * truncates the string to the specified length from the right if necessary
 */
var spaces = "                                        ";
String.prototype.lpad = function(length, classes) {
    var string = (spaces + (this || "")).slice(0 - length);
    string = "<span class='" + (classes || "") + "'>" + string + "</span>";
    return string;
};

/**
 * Return the string padded with spaces on the right to the specified length;
 * truncates the string to the specified length from the left if necessary
 */
String.prototype.rpad = function(length, classes) {
    var string = ((this || "") + spaces).slice(0, length);
    string = "<span class='" + (classes || "") + "'>" + string + "</span>";
    return string;
};

/**
 * Return the string with {x} placeholders replaced by their ordinal match in
 * the arguments list; if arguments run out before ordinals, no replacement
 * occurs, leaving the placeholder.
 */
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] !== undefined ? args[number] : match;
    });
};

/**
 * Return the object's name attribute if it has one, standard string otherwise
 */
Object.prototype.toString = function() { return this.name || String({}); };


var helpText = "\n" +
    "    \n" +
    "    Crawl the dungeon the find the lozenge of power!  It looks like this:" +
    " <span class='item treasure'>\u22c4</span>\n" +
    "    \n" +
    "    To move in eight directions:\n" +
    "      <strong>u</strong>  <strong>i</strong>  <strong>o</strong>\n" +
    "      <strong>j</strong>     <strong>l</strong>\n" +
    "      <strong>m</strong>  <strong>,</strong>  <strong>.</strong>\n" +
    "    \n" +
    "    To attack, stand next to a monster and move into its square!\n" +
    "    \n" +
    "    Chests (<span class='item'>\u2709</span>) and Piles" +
    " (<span class='item'>\u2234</span>) hold gold or better equipment!\n" +
    "    \n" +
    "    To use whatever you're on: <strong>k</strong>!\n" +
    "    \n" +
    "    Stairs up (<span class='stairs'>\u2191</span>) and down (<span " +
    "class='stairs'>\u2193</span>) carry you between levels!\n" +
    "    \n" +
    "    Messages:\n" +
    "      <strong>t</strong>  To scroll down\n" +
    "      <strong>g</strong>  To scroll up\n" +
    "      <strong>b</strong>  To delete the current message\n" +
    "    \n" +
    "    <strong>?</strong>  To go back to the dungeon\n" +
    "\n",

    gameOverText = "\n" +
    "    \n" +
    "    You died on level {0}, killed by a {1}.\n" +
    "    \n" +
    "    You had {2} gold, a {3}, and {4} armor.\n" +
    "    \n" +
    "    Reload the page to start over.\n" +
    "    \n" +
    "    The lozenge of power is still down there...\n" +
    "\n",

    lozengeText = "\n" +
    "    \n" +
    "    You found the lozenge of power!  Your nagging cough will soon be " +
    "vanquished...\n" +
    "    \n" +
    "    if you make it back to town.\n" +
    "    \n" +
    "    Hit <strong>k</strong> to continue.\n" +
    "\n",

    victoryText = "\n" +
    "    \n" +
    "    You found the lozenge of power, and brought it back to civilization!\n" +
    "    \n" +
    "    And made {0} gold along the way.\n" +
    "    \n" +
    "    Reload the page to try again.\n" +
    "\n",

    townText = "\n" +
    "    \n" +
    "    This is where the town would go if one existed.\n" +
    "    \n" +
    "    Hit <strong>k</strong> to return to the dungeon.\n" +
    "\n";

var context = null,
    screens = {
        dungeon: undefined,
        town: townText,
        help: helpText,
        gameOver: undefined,
        lozenge: lozengeText,
        victory: undefined,
        blank: undefined
    },
    config = {
        screens: screens,
        // dungeon parameters
        height: 25,
        width: 50,
        lozenge_level: 10,
        initial_visibility: 0,
        weapon: "Sword",
        armor: "Scale",

        // room generation
        max_attempts: 60,
        max_rooms: 15,
        max_mobs: 10,
        max_items: 5,
    };

function init() {
    context = new Context(config);
    document.body.insertBefore(context.element, document.body.firstChild);
    document.onkeypress = context.handleInput;
    context.add_message("Initialization complete!");
    context.refresh();
}


