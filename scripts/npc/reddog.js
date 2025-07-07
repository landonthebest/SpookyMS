// Casino Red Dog NPC Script (Max Bet is Half Mesos)
var status = -1;
var betAmount = 0;
var totalBet = 0;
var didRaise = false;
var card1, card2, card3, spread;
var deck = [];

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
    betAmount = 0;
    totalBet = 0;
    didRaise = false;
    card1 = null; card2 = null; card3 = null; spread = 0;
    deck = [];
    status = -1;
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

function start() { 
    resetAll(); 
    action(1, 0, 0); 
}

function action(mode, type, selection) {
    // End on any cancel
    if (mode != 1) { resetAll(); cm.dispose(); return; }
    status++;

    // Betting
    if (status == 0) {
        var maxBet = Math.floor(cm.getMeso() / 2);
        if (maxBet < 1000) {
            cm.sendOk("You need at least 2000 mesos to play (min 1000 bet, and max bet is half your mesos for raising).");
            resetAll();
            cm.dispose();
            return;
        }
        cm.sendGetNumber(
            "Welcome to #eRed Dog#n!\r\nHow many mesos would you like to bet?\r\n#r(Min: 1000, Max: " + maxBet + ")#k",
            1000, 1000, maxBet
        );
    }
    // Confirm bet
    else if (status == 1) {
        betAmount = selection;
        var maxBet = Math.floor(cm.getMeso() / 2);
        if (betAmount < 1000 || betAmount > maxBet) {
            cm.sendOk("Invalid bet amount.");
            resetAll(); cm.dispose(); return;
        }
        totalBet = betAmount;
        cm.sendYesNo("Are you sure you want to bet #b" + betAmount + "#k mesos?");
    }
    // Draw two cards
    else if (status == 2) {
        cm.gainMeso(-betAmount);
        deck = shuffleDeck();
        card1 = deck.pop();
        card2 = deck.pop();
        var msg = "#eYour cards:#n " + "#i" + card1.id + "# (" + card1.name + ") and #i" + card2.id + "# (" + card2.name + ")";
        if (card1.value == card2.value) {
            msg += "\r\n\r\nBoth cards are the same! Drawing a third card...";
            cm.sendNext(msg);
            status = 98; // Special state for same-card 3rd draw
            return;
        } else if (Math.abs(card1.value - card2.value) == 1) {
            msg += "\r\n\r\nCards are consecutive! It's a push. Your bet is returned.";
            cm.gainMeso(totalBet);
            cm.sendOk(msg + "\r\n\r\nThanks for playing! If you want to play again, just talk to me!");
            resetAll(); cm.dispose();
        } else {
            spread = Math.abs(card1.value - card2.value) - 1;
            msg += "\r\n\r\nSpread between cards: #b" + spread + "#k";
            msg += "\r\nWhat do you want to do?\r\n#L0#Raise (double bet, double payout)#l\r\n#L1#Call (no raise)#l";
            cm.sendSimple(msg);
        }
    }
    // Player decision: Raise or Call
    else if (status == 3) {
        didRaise = (selection === 0);
        if (didRaise) {
            if (cm.getMeso() < betAmount) {
                cm.sendOk("Not enough mesos to raise. You must have enough mesos to double your bet (need " + betAmount + " more).");
                resetAll(); cm.dispose(); return;
            }
            cm.gainMeso(-betAmount);
            totalBet += betAmount;
        }
        card3 = deck.pop();
        handleThirdCard(card3);
    }
    // Status 98: Third card when first two are equal (pair)
    else if (status == 99) {
        card3 = deck.pop();
        var msg = "Third card: #i" + card3.id + "# (" + card3.name + ")\r\n";
        if (card3.value == card1.value) {
            var jackpot = 2000000;
            msg += "#bJACKPOT!! All three cards match!#k\r\n#eYou win #r" + jackpot.toLocaleString() + "#k #emesos!!#n";
            cm.gainMeso(jackpot);
        } else {
            msg += "No match. It's a push. Your bet is returned.";
            cm.gainMeso(totalBet);
        }
        cm.sendOk(msg + "\r\n\r\nThanks for playing! If you want to play again, just talk to me!");
        resetAll(); cm.dispose();
    }
    // Special handler for status after pair third card message (transition 98 -> 99)
    else if (status == 98) {
        status = 99;
        action(1, 0, 0);
        return;
    }
}

// Evaluate outcome for third card (regular hand)
function handleThirdCard(card3) {
    var low = Math.min(card1.value, card2.value), high = Math.max(card1.value, card2.value);
    var msg = "#eYour cards:#n " + "#i" + card1.id + "# (" + card1.name + ") and #i" + card2.id + "# (" + card2.name + ")";
    msg += "\r\nThird card: #i" + card3.id + "# (" + card3.name + ")\r\n";
    var winnings = 0;
    if (card3.value == card1.value || card3.value == card2.value) {
        winnings = totalBet * 3;
        msg += "#gMatched one of your cards! Triple payout!#k\r\nYou win #b" + winnings + "#k mesos.";
        cm.gainMeso(winnings);
    } else if (card3.value > low && card3.value < high) {
        // Red Dog payout (classic: spread 1=5x, 2=4x, 3=2x, 4+=1x)
        if (spread == 1) winnings = totalBet * 5;
        else if (spread == 2) winnings = totalBet * 4;
        else if (spread == 3) winnings = totalBet * 2;
        else winnings = totalBet * 1;
        msg += "#gCard is between! You win!#k\r\nSpread: #b" + spread + "#k\r\nWinnings: #b" + winnings + "#k mesos.";
        cm.gainMeso(winnings);
    } else {
        msg += "#rCard is not between. You lose your bet.#k";
    }
    cm.sendOk(msg + "\r\n\r\nThanks for playing! If you want to play again, just talk to me!");
    resetAll(); cm.dispose();
}
