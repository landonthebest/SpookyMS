/*
 * Baccarat NPC for MapleStory - separate final results window
 */

var status = -1;
var inSummary = false;
var betAmount = 0;
var betType = -1;
var deck = [];
var playerHand = [], bankerHand = [];
var playerTotal = 0, bankerTotal = 0;

var mathMsg = ""; // Store card math text to display on results window

var cards = [
    {id: 4310002, name: "2", value: 2},
    {id: 4310003, name: "3", value: 3},
    {id: 4310004, name: "4", value: 4},
    {id: 4310005, name: "5", value: 5},
    {id: 4310006, name: "6", value: 6},
    {id: 4310007, name: "7", value: 7},
    {id: 4310008, name: "8", value: 8},
    {id: 4310009, name: "9", value: 9},
    {id: 4310010, name: "10", value: 0},
    {id: 4310011, name: "Ace", value: 1},
    {id: 4310012, name: "Jack", value: 0},
    {id: 4310013, name: "Queen", value: 0},
    {id: 4310014, name: "King", value: 0}
];

function resetAll() {
    status = -1;
    inSummary = false;
    betAmount = 0;
    betType = -1;
    deck = [];
    playerHand = [];
    bankerHand = [];
    playerTotal = 0;
    bankerTotal = 0;
    mathMsg = "";
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

function displayHand(hand) {
    var str = "";
    for (var i = 0; i < hand.length; i++)
        str += "#i" + hand[i].id + "# ";
    return str;
}

function baccaratTotal(hand) {
    var total = 0;
    for (var i = 0; i < hand.length; i++)
        total += hand[i].value;
    return total % 10;
}

function displayMath(hand) {
    var values = hand.map(function(card){ return card.value; });
    var total = values.reduce(function(sum, v){ return sum + v; }, 0);
    return values.join("    +    ") + "    =    " + (total % 10);
}


function start() {
    resetAll();
    status = 0;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode != 1) {
        resetAll();
        cm.dispose();
        return;
    }
    if (inSummary) {
        resetAll();
        cm.dispose();
        return;
    }

    if (status == 0) {
        var maxBet = Math.floor(cm.getMeso() / 2);
        if (maxBet < 1000) {
            cm.sendOk("You need at least 2000 mesos to play (minimum bet is 1000, max is half your mesos).");
            cm.dispose();
            return;
        }
        cm.sendGetNumber(
            "Welcome to #eBaccarat#n!\r\nHow many mesos would you like to bet?\r\n#r(Min: 1000, Max: " + maxBet + ")#k",
            1000, 1000, maxBet
        );
        status++;
    }
    else if (status == 1) {
        betAmount = selection;
        var maxBet = Math.floor(cm.getMeso() / 2);
        if (betAmount < 1000 || betAmount > maxBet) {
            cm.sendOk("Invalid bet amount. Max bet is half your mesos (" + maxBet + ").");
            resetAll(); cm.dispose(); return;
        }
        cm.sendSimple(
            "Place your bet:\r\n#L0##bPlayer#k\r\n#L1##rBanker#k\r\n#L2##dTie#k"
        );
        status++;
    }
    else if (status == 2) {
        betType = selection;
        cm.gainMeso(-betAmount);
        deck = shuffleDeck();
        playerHand = [deck.pop()];
        bankerHand = [deck.pop()];
        cm.sendSimple(
            "Dealing...\r\n\r\nPlayer: " + displayHand(playerHand) + "\r\nBanker: " + displayHand(bankerHand) +
            "\r\n\r\n#L0#Deal second card#l"
        );
        status++;
    }
    else if (status == 3) {
        playerHand.push(deck.pop());
        bankerHand.push(deck.pop());
        cm.sendSimple(
            "Dealing...\r\n\r\nPlayer: " + displayHand(playerHand) + "\r\nBanker: " + displayHand(bankerHand) +
            "\r\n\r\n#L0#Show Cards & Math#l"
        );
        status++;
    }
    else if (status == 4) {
        // Prepare the card math/results window, but do NOT show payout yet
        playerTotal = baccaratTotal(playerHand);
        bankerTotal = baccaratTotal(bankerHand);

        mathMsg = "Player: " + displayHand(playerHand) + "\r\n";
        mathMsg += "#bMath: " + displayMath(playerHand) + "#k\r\n";
        mathMsg += "Banker: " + displayHand(bankerHand) + "\r\n";
        mathMsg += "#rMath: " + displayMath(bankerHand) + "#k\r\n";
        mathMsg += "\r\n";

        // Natural check
        if (playerTotal >= 8 || bankerTotal >= 8) {
            mathMsg += "#eNatural! No more cards drawn.#n\r\n";
            cm.sendSimple(mathMsg + "\r\n#L0#Show Results#l");
            status = 5; // Jump to results window next
            return;
        }

        // Player draw rule
        var playerDraws = (playerTotal <= 5);
        var playerDrawnCard = null;
        if (playerDraws) {
            playerDrawnCard = deck.pop();
            playerHand.push(playerDrawnCard);
            playerTotal = baccaratTotal(playerHand);
            mathMsg += "#bPlayer draws a third card:#k " + "#i" + playerDrawnCard.id + "# (" + playerDrawnCard.value + ")\r\n";
            mathMsg += "#bMath: " + displayMath(playerHand) + "#k\r\n";
        } else {
            mathMsg += "#bPlayer stands.#k\r\n";
        }

        // Banker draw rule
        var bankerDraws = false;
        var bankerDrawnCard = null;
        var b0 = bankerTotal, p3 = playerDrawnCard ? playerDrawnCard.value : -1;
        if (!playerDraws) {
            if (b0 <= 5) bankerDraws = true;
        } else {
            if (b0 <= 2) bankerDraws = true;
            else if (b0 == 3 && p3 != 8) bankerDraws = true;
            else if (b0 == 4 && [2,3,4,5,6,7].indexOf(p3) != -1) bankerDraws = true;
            else if (b0 == 5 && [4,5,6,7].indexOf(p3) != -1) bankerDraws = true;
            else if (b0 == 6 && [6,7].indexOf(p3) != -1) bankerDraws = true;
        }
        if (bankerDraws) {
            bankerDrawnCard = deck.pop();
            bankerHand.push(bankerDrawnCard);
            bankerTotal = baccaratTotal(bankerHand);
            mathMsg += "#rBanker draws a third card:#k " + "#i" + bankerDrawnCard.id + "# (" + bankerDrawnCard.value + ")\r\n";
            mathMsg += "#rMath: " + displayMath(bankerHand) + "#k\r\n";
        } else {
            mathMsg += "#rBanker stands.#k\r\n";
        }

        // After all card math is displayed, player must click to see final summary
        cm.sendSimple(mathMsg + "\r\n#L0#Show Results#l");
        status++; // status = 5
    }
    else if (status == 5) {
        // Final window: winner and payout
        var msg = "----- #eBaccarat Summary#n -----\r\n";
        msg += mathMsg + "\r\n";
        playerTotal = baccaratTotal(playerHand);
        bankerTotal = baccaratTotal(bankerHand);

        msg += "#bFinal Totals:#k Player: " + playerTotal + ", Banker: " + bankerTotal + "\r\n";
        var winMsg = "";
        var payout = 0;

        if (playerTotal == bankerTotal) {
            winMsg = "#dIt's a TIE!#k\r\n";
            if (betType == 2) {
                payout = betAmount * 8;
                winMsg += "#gYou win 8x your bet! (" + payout + " mesos)#k";
                cm.gainMeso(payout);
            } else {
                winMsg += "Your bet is returned.";
                cm.gainMeso(betAmount);
            }
        } else if (playerTotal > bankerTotal) {
            if (betType == 0) {
                payout = betAmount * 2;
                winMsg = "#gPLAYER wins! You win " + payout + " mesos.#k";
                cm.gainMeso(payout);
            } else {
                winMsg = "#rPLAYER wins. You lost your bet.#k";
            }
        } else {
            if (betType == 1) {
                payout = Math.floor(betAmount * 1.95); // Banker takes 5% commission
                winMsg = "#gBANKER wins! You win " + payout + " mesos.#k";
                cm.gainMeso(payout);
            } else {
                winMsg = "#rBANKER wins. You lost your bet.#k";
            }
        }
        msg += "\r\n" + winMsg;
        msg += "\r\n\r\n#L0#Exit#l";
        inSummary = true;
        cm.sendSimple(msg);
    }
}
