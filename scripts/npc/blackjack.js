/*
 * Simple Blackjack NPC - Requires Blackjack Pass (4310025)
 * AdventureMS - With Double Down!
 */
var inSummary = false;
var status = -1;
var betAmount = 0;
var doubleDown = false;   // <-- Track if doubled down
var playerHand = [], dealerHand = [], deck = [];
var playerTotal = 0, dealerTotal = 0;
var debug = true;
var playerBlackjack = false;
var dealerBlackjack = false;

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

function resetAll() {
    status = -1;
    betAmount = 0;
    doubleDown = false;
    playerHand = [];
    dealerHand = [];
    deck = [];
    playerTotal = dealerTotal = 0;
    inSummary = false;
    playerBlackjack = false;
    dealerBlackjack = false;
}

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

function getHandTotal(hand) {
    var total = 0, aces = 0;
    for (var i = 0; i < hand.length; i++) {
        total += hand[i].value;
        if (hand[i].id == 4310011) aces++;
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function displayHand(hand) {
    var str = "";
    for (var i = 0; i < hand.length; i++)
        str += "#i" + hand[i].id + "#";
    return str;
}

function start() { resetAll(); action(1, 0, 0); }

function action(mode, type, selection) {
    if (debug) cm.logToConsole("[BJ] status=" + status + ", mode=" + mode + ", selection=" + selection + ", doubleDown=" + doubleDown);
    if (inSummary) {
        resetAll();
        cm.dispose();
        return;
    }
    if (mode != 1) { resetAll(); cm.dispose(); return; }

    // Require Blackjack Pass at the start
    if (!cm.haveItem(4310025, 1)) {
        cm.sendOk("You need a #bBlackjack Pass#k (#i4310025#) to play! Get one before playing.");
        cm.dispose();
        return;
    }

    if (status != 3) status++;

    if (status == 0) {
        var maxBet = Math.floor(cm.getMeso() / 2); // Max is HALF your mesos!
        if (maxBet < 1000) {
            cm.sendOk("You need at least 2000 mesos to play (minimum bet is 1000, but max bet is half your mesos).");
            cm.dispose();
            return;
        }
        cm.sendGetNumber(
            "Welcome to #eBlackjack#n!\r\n#rRequires a Blackjack Pass (#i4310025#) to play!#k\r\nHow many mesos would you like to bet?\r\n#r(Min: 1000, Max: " + maxBet + ")#k",
            1000, 1000, maxBet
        );
    } else if (status == 1) {
        betAmount = selection;
        var maxBet = Math.floor(cm.getMeso() / 2);
        if (betAmount < 1000 || betAmount > maxBet) {
            cm.sendOk("Invalid bet amount. Max bet is half your mesos (" + maxBet + ")."); resetAll(); cm.dispose(); return;
        }
        cm.sendYesNo("Are you sure you want to bet #b" + betAmount + "#k mesos?\r\n#rA Blackjack Pass will be consumed to play.#k");
    } else if (status == 2) {
        if (!cm.haveItem(4310025, 1)) {
            cm.sendOk("You don't have a Blackjack Pass anymore!"); resetAll(); cm.dispose(); return;
        }
        cm.gainItem(4310025, -1); // Remove 1 pass
        cm.gainMeso(-betAmount);
        deck = shuffleDeck();
        playerHand = [deck.pop(), deck.pop()];
        dealerHand = [deck.pop(), deck.pop()];
        playerTotal = getHandTotal(playerHand);
        dealerTotal = getHandTotal(dealerHand);

        // Check for opening Blackjack
        playerBlackjack = (playerHand.length == 2 && playerTotal == 21);
        dealerBlackjack = (dealerHand.length == 2 && dealerTotal == 21);

        if (debug) cm.logToConsole("[BJ] Initial hands: player=" + JSON.stringify(playerHand) + ", dealer=" + JSON.stringify(dealerHand));
        showPlayerHand(true); // true = first action, show Double Down
    } else if (status == 3) {
        // Double Down
        if (selection === 2) {
            // Double the bet if player can afford it (already paid for first half!)
            if (cm.getMeso() < betAmount) {
                cm.sendOk("You do not have enough mesos to double down. (Need " + betAmount + " more mesos.)");
                resetAll(); cm.dispose(); return;
            }
            cm.gainMeso(-betAmount); // Pay second half
            doubleDown = true;
            playerHand.push(deck.pop());
            playerTotal = getHandTotal(playerHand);
            playerBlackjack = false; // No blackjack after hit
            if (debug) cm.logToConsole("[BJ] Player double down: " + JSON.stringify(playerHand) + ", total=" + playerTotal);

            // Dealer's turn after one hit
            while (getHandTotal(dealerHand) < 17)
                dealerHand.push(deck.pop());
            dealerTotal = getHandTotal(dealerHand);
            showFinalHands(playerTotal > 21);
            return;
        }

        if (playerTotal >= 21) {
            while (getHandTotal(dealerHand) < 17)
                dealerHand.push(deck.pop());
            dealerTotal = getHandTotal(dealerHand);
            showFinalHands(playerTotal > 21);
            return;
        }
        if (selection == 0) { // Hit
            playerHand.push(deck.pop());
            playerTotal = getHandTotal(playerHand);
            playerBlackjack = false; // No blackjack after a hit!
            if (debug) cm.logToConsole("[BJ] Player hits: " + JSON.stringify(playerHand) + ", total=" + playerTotal);
            if (playerTotal >= 21) {
                while (getHandTotal(dealerHand) < 17)
                    dealerHand.push(deck.pop());
                dealerTotal = getHandTotal(dealerHand);
                showFinalHands(playerTotal > 21);
                return;
            }
            showPlayerHand(false); // false = not first action, no Double Down
        } else if (selection == 1) { // Stand
            while (getHandTotal(dealerHand) < 17)
                dealerHand.push(deck.pop());
            dealerTotal = getHandTotal(dealerHand);
            showFinalHands(false);
            return;
        }
    } else if (status == 4) {
        resetAll();
        cm.dispose();
    }
}

// Show hand, with double down option (only first move)
function showPlayerHand(firstMove) {
    var msg = "Your cards: " + displayHand(playerHand) + " #b(" + playerTotal + ")#k\r\n";
    var firstCard = dealerHand[0];
    msg += "Dealer: #i" + firstCard.id + "# " +
        (firstCard.id == 4310011 ? "Ace (1 or 11)" : cards.find(function(c){return c.id==firstCard.id}).name + " (" + firstCard.value + ")") +
        "  [?]\r\n";
    msg += "#L0#Hit#l\r\n#L1#Stand#l";
    if (firstMove && cm.getMeso() >= betAmount) {
        msg += "\r\n#L2#Double Down (" + (betAmount * 2) + " total bet)#l";
    }
    cm.sendSimple(msg);
}

function showFinalHands(playerBusted) {
    var msg = "----- #eBlackjack Summary#n -----\r\n";
    msg += "#bYour hand (" + playerTotal + "):#k " + displayHand(playerHand) + "\r\n";
    msg += "#bDealer's hand (" + dealerTotal + "):#k " + displayHand(dealerHand) + "\r\n\r\n";

    // Opening blackjack logic (player and/or dealer)
    if (playerBlackjack && dealerBlackjack) {
        msg += "#bBoth you and the dealer got Blackjack! It's a tie. Your bet is returned.#k";
        cm.gainMeso(betAmount);
    } else if (playerBlackjack) {
        msg += "#gBLACKJACK! You win triple your bet!#k\r\nWinnings: #b" + (betAmount * 3) + "#k mesos";
        cm.gainMeso(betAmount * 3);
    } else if (playerBusted || playerTotal > 21) {
        if (doubleDown) {
            msg += "#rYou bust on double down! You lost #b" + (betAmount * 2) + "#r mesos.#k";
        } else {
            msg += "#rYou bust! You lost your bet.#k";
        }
    } else if (dealerTotal > 21) {
        if (doubleDown) {
            msg += "Dealer busts! #gYou win double down!#k\r\nWinnings: #b" + (betAmount * 4) + "#k mesos";
            cm.gainMeso(betAmount * 4);
        } else {
            msg += "Dealer busts! #gYou win!#k\r\nWinnings: #b" + (betAmount * 2) + "#k mesos";
            cm.gainMeso(betAmount * 2);
        }
    } else if (playerTotal > dealerTotal) {
        if (doubleDown) {
            msg += "#gYou win double down!#k\r\nWinnings: #b" + (betAmount * 4) + "#k mesos";
            cm.gainMeso(betAmount * 4);
        } else {
            msg += "#gYou win!#k\r\nWinnings: #b" + (betAmount * 2) + "#k mesos";
            cm.gainMeso(betAmount * 2);
        }
    } else if (playerTotal == dealerTotal) {
        msg += "It's a tie! Your bet is returned.";
        cm.gainMeso(betAmount);
    } else {
        if (doubleDown) {
            msg += "Dealer wins! #rYou lost your double bet (" + (betAmount * 2) + " mesos).#k";
        } else {
            msg += "Dealer wins! #rYou lost your bet.#k";
        }
    }
    msg += "\r\n\r\n#L0#Exit#l";
    cm.sendSimple(msg);
    inSummary = true;
    status = 3;
}
