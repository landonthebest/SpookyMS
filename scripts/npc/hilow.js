var status = -1;
var betAmount = 0;
var currentCard = null;
var nextCard = null;
var deck = [];
var streak = 0;
var debug = true;

var cards = [
    {id: 4310002, name: "2", value: 2},
    {id: 4310003, name: "3", value: 3},
    {id: 4310004, name: "4", value: 4},
    {id: 4310005, name: "5", value: 5},
    {id: 4310006, name: "6", value: 6},
    {id: 4310007, name: "7", value: 7},
    {id: 4310008, name: "8", value: 8},
    {id: 4310009, name: "9", value: 9},
    {id: 4310010, name: "10", value: 10},
    {id: 4310011, name: "Ace", value: 11},
    {id: 4310012, name: "Jack", value: 10},
    {id: 4310013, name: "Queen", value: 10},
    {id: 4310014, name: "King", value: 10}
];

function shuffleDeck() {
    var d = [];
    for (var i = 0; i < 4; i++)
        for (var j = 0; j < cards.length; j++)
            d.push(cards[j]);
    for (var i = d.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = d[i];
        d[i] = d[j]; d[j] = t;
    }
    return d;
}

function start() {
    status = -1; betAmount = 0; streak = 0;
    deck = shuffleDeck();
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode != 1) { cm.dispose(); return; }
    status++;
    if (debug) cm.logToConsole("[HiLow] status=" + status + ", selection=" + selection);

    if (status == 0) {
        var maxBet = Math.floor(cm.getMeso() / 2);
        if (maxBet < 1000) {
            cm.sendOk("You need at least 2000 mesos to play (min: 1000, max: " + maxBet + ").");
            cm.dispose(); return;
        }
        cm.sendGetNumber("Welcome to #eHi-Low#n!\r\nHow many mesos would you like to bet?\r\n#r(Min: 1000, Max: " + maxBet + ")#k", 1000, 1000, maxBet);
    } else if (status == 1) {
        betAmount = selection;
        var maxBet = Math.floor(cm.getMeso() / 2);
        if (betAmount < 1000 || betAmount > maxBet) {
            cm.sendOk("Invalid bet amount. Max bet is half your mesos (" + maxBet + ").");
            cm.dispose(); return;
        }
        cm.sendYesNo("Are you sure you want to bet #b" + betAmount + "#k mesos?");
    } else if (status == 2) {
        cm.gainMeso(-betAmount);
        currentCard = deck.pop();
        cm.sendSimple("Here is your starting card:\r\n#b" + currentCard.name + "#k #i" + currentCard.id + "#\r\n\r\n#L0#Go Higher#l\r\n#L1#Go Lower#l");
    } else if (status == 3) {
        var guessHigher = (selection == 0);
        nextCard = deck.pop();

        var msg = "Next card is: #b" + nextCard.name + "#k #i" + nextCard.id + "#\r\n";
        if (nextCard.value == currentCard.value) {
            msg += "#rIt's a tie! You lose.#k\r\n\r\n#L0#Exit#l";
            cm.sendSimple(msg);
            status = 98; // End game
            return;
        }

        var playerWins = (guessHigher && nextCard.value > currentCard.value) || (!guessHigher && nextCard.value < currentCard.value);

        if (playerWins) {
            streak++;
            msg += "#gYou win!#k\r\nCurrent streak: #b" + streak + "#k\r\n";
            msg += "Do you want to continue for a higher multiplier, or cash out now?\r\n";
            msg += "#L0#Continue (x" + (2 + streak) + " total)#l\r\n#L1#Cash out now! (Receive " + (betAmount * (2 + streak)) + " mesos)#l";
            cm.sendSimple(msg);
            currentCard = nextCard; // Carry on
            status = 10; // Jump to streak logic
        } else {
            msg += "#rYou lose!#k\r\nYour streak was: " + streak + "\r\n\r\n#L0#Exit#l";
            cm.sendSimple(msg);
            status = 98;
        }
    } else if (status == 11) { // Continue streak
    if (selection == 0) { // Continue
        // Jump back to the guess phase!
        status = 2;
        cm.sendSimple("Current card: #b" + currentCard.name + "#k #i" + currentCard.id + "#\r\n\r\n#L0#Go Higher#l\r\n#L1#Go Lower#l");
        // Do NOT return here; let status++ run on next input
    } else { // Cash out
        var payout = betAmount * (2 + streak);
        cm.gainMeso(payout);
        cm.sendOk("#gCongratulations!#k You cashed out for #b" + payout + "#k mesos after " + streak + " correct guesses!");
        cm.dispose();
    }
}
 else if (status == 99 || status == 98) {
        cm.dispose();
    }
}
