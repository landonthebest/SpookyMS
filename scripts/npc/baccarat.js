/*
 * Simple Vegas Baccarat - AdventureMS
 * 8-Deck, No Commission, Three main bets only.
 */
var status = -1;
var betAmount = 0;
var betChoice = ""; // "Player", "Banker", "Tie"
var shoe = [];
var playerHand = [], bankerHand = [];
var playerThirdCard = null, bankerThirdCard = null;
var debug = false;

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
    betAmount = 0;
    betChoice = "";
    shoe = [];
    playerHand = [];
    bankerHand = [];
    playerThirdCard = null;
    bankerThirdCard = null;
}

function shuffleShoe() {
    var d = [];
    for (var i = 0; i < 8; i++)
        for (var j = 0; j < cards.length; j++)
            d.push(cards[j]);
    for (var i = d.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = d[i];
        d[i] = d[j]; d[j] = t;
    }
    return d;
}

function handTotal(hand) {
    var total = 0;
    for (var i = 0; i < hand.length; i++)
        total += hand[i].value;
    return total % 10;
}

function displayHand(hand) {
    var str = "";
    for (var i = 0; i < hand.length; i++)
        str += "#i" + hand[i].id + "#";
    return str;
}

function start() { resetAll(); action(1, 0, 0); }

function action(mode, type, selection) {
    if (mode != 1) { resetAll(); cm.dispose(); return; }
    status++;

    if (status == 0) {
        var maxBet = Math.floor(cm.getMeso() / 2);
        if (maxBet < 1000) {
            cm.sendOk("You need at least 2000 mesos to play (minimum bet is 1000, max bet is half your mesos).");
            resetAll(); cm.dispose(); return;
        }
        cm.sendGetNumber(
            "Welcome to #eBaccarat#n!\r\nHow many mesos would you like to bet?\r\n#r(Min: 1000, Max: " + maxBet + ")#k",
            1000, 1000, maxBet
        );
    }
    else if (status == 1) {
        betAmount = selection;
        var maxBet = Math.floor(cm.getMeso() / 2);
        if (betAmount < 1000 || betAmount > maxBet) {
            cm.sendOk("Invalid bet amount. Max bet is half your mesos (" + maxBet + ").");
            resetAll(); cm.dispose(); return;
        }
        cm.sendSimple(
            "Place your main bet:\r\n#L0##rPlayer (1:1)#k#l\r\n#L1##bBanker (No Comm)#k#l\r\n#L2##dTie (9:1)#k#l"
        );
    }
    else if (status == 2) {
        if (selection == 0) betChoice = "Player";
        else if (selection == 1) betChoice = "Banker";
        else if (selection == 2) betChoice = "Tie";

        cm.sendYesNo("You bet #b" + betAmount + "#k mesos on #e" + betChoice + "#n.\r\nReady to deal?");
    }
    else if (status == 3) {
        cm.gainMeso(-betAmount);
        shoe = shuffleShoe();

        playerHand = [shoe.pop(), shoe.pop()];
        bankerHand = [shoe.pop(), shoe.pop()];
        playerThirdCard = null;
        bankerThirdCard = null;

        // Natural check
        var playerScore = handTotal(playerHand);
        var bankerScore = handTotal(bankerHand);
        var naturalFinish = (playerScore >= 8 || bankerScore >= 8);

        // Third card rules
        if (!naturalFinish) {
            // Player third card
            if (playerScore <= 5) {
                playerThirdCard = shoe.pop();
                playerHand.push(playerThirdCard);
            }
            // Banker third card
            bankerScore = handTotal(bankerHand); // recalc in case player didn't draw
            var p3 = (playerThirdCard ? playerThirdCard.value : -1);

            var bankerDraw = false;
            if (playerThirdCard == null) {
                if (bankerScore <= 5) bankerDraw = true;
            } else {
                if (bankerScore <= 2) bankerDraw = true;
                else if (bankerScore == 3 && p3 != 8) bankerDraw = true;
                else if (bankerScore == 4 && [2,3,4,5,6,7].indexOf(p3) != -1) bankerDraw = true;
                else if (bankerScore == 5 && [4,5,6,7].indexOf(p3) != -1) bankerDraw = true;
                else if (bankerScore == 6 && (p3 == 6 || p3 == 7)) bankerDraw = true;
            }
            if (bankerDraw) {
                bankerThirdCard = shoe.pop();
                bankerHand.push(bankerThirdCard);
            }
        }

        // Always show both full hands, all cards
        var finalPlayerScore = handTotal(playerHand);
        var finalBankerScore = handTotal(bankerHand);

        var msg = "#eBaccarat Results#n\r\n\r\n";
        msg += "Your bet: #b" + betAmount + "#k mesos on #e" + betChoice + "#n\r\n\r\n";
        msg += "#bPlayer#k: " + displayHand(playerHand) + " (" + finalPlayerScore + ")\r\n";
        msg += "#rBanker#k: " + displayHand(bankerHand) + " (" + finalBankerScore + ")\r\n\r\n";

        var winner = "";
        if (finalPlayerScore > finalBankerScore) winner = "Player";
        else if (finalBankerScore > finalPlayerScore) winner = "Banker";
        else winner = "Tie";
        msg += "#eWinner:#n #b" + winner + "#k\r\n";

        // Payout calculation
        var winnings = 0;
        if (betChoice == winner) {
            if (winner == "Player") {
                winnings = betAmount * 2;
                msg += "#gYou win! Player pays 1:1#k";
            } else if (winner == "Banker") {
                if (finalBankerScore == 6) {
                    winnings = Math.floor(betAmount * 1.5); // Pays half (No Comm, Banker 6)
                    msg += "#gBanker wins with 6! Pays 50%.#k";
                } else {
                    winnings = betAmount * 2;
                    msg += "#gYou win! Banker pays 1:1#k";
                }
            } else if (winner == "Tie") {
                winnings = betAmount * 9;
                msg += "#gYou win! Tie pays 9:1#k";
            }
        } else {
            if (winner == "Tie" && (betChoice == "Player" || betChoice == "Banker")) {
                winnings = betAmount; // push
                msg += "#bIt's a tie! Your bet is returned.#k";
            } else {
                msg += "#rYou lost your bet.#k";
            }
        }

        if (winnings > 0)
            cm.gainMeso(winnings);

        msg += "\r\n\r\n#L0#Exit#l";
        cm.sendSimple(msg);
        status = 99;
    }
    else if (status == 99) {
        resetAll();
        cm.dispose();
    }
}
