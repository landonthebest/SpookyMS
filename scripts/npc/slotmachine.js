/*
 * Casino Slot Machine NPC
 * @NPC: 9901000
 * MapleStory v83 compatible
 * 5x5 slot, column reveals, random weights, per-symbol payouts, multipliers as icons, 15% tax
 * Unique cell payout, minimal summary (no symbol names), safe for v83
 */

var status = 0;
var rows = 5;
var cols = 5;
var spinCost = 1000;
var taxRate = 0.15;

var baseSymbols = [
    { id: 4310015, name: "Orange Marble", payout: 200 },
    { id: 4310016, name: "Diamond", payout: 10000 },
    { id: 4310017, name: "Emerald", payout: 5000 },
    { id: 4310018, name: "Gold Coin", payout: 1500 },
    { id: 4310019, name: "Blue Marble", payout: 800 },
    { id: 4310021, name: "Yellow Star", payout: 2000 },
    { id: 4310022, name: "Red Gem", payout: 3500 },
    { id: 4310023, name: "Leaf", payout: 600 }
];

// Multiplier symbols: [id, multiplier]
var multiplierSymbols = [
    [4310027, 2],
    [4310028, 3],
    [4310029, 4]
];
var multiplierValueToId = {};
for (var i = 0; i < multiplierSymbols.length; i++) {
    multiplierValueToId[multiplierSymbols[i][1]] = multiplierSymbols[i][0];
}

var board = null;
var revealCol = 0;
var symbolWeights = null;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == -1 || (mode == 0 && status == 0)) {
        cm.dispose();
        return;
    }
    status += (mode == 1 ? 1 : -1);

    if (status == 0) {
        cm.sendYesNo("Spin the slot machine for " + spinCost + " mesos?");
    } else if (status == 1) {
        if (cm.getMeso() < spinCost) {
            cm.sendOk("You don't have enough mesos.");
            cm.dispose();
            return;
        }
        cm.gainMeso(-spinCost);
        symbolWeights = randomizeSymbolWeights();
        board = generateBoard();
        revealCol = 0;
        cm.sendNext(formatPartialBoard());
    } else if (status >= 2 && status <= cols) {
        revealCol++;
        cm.sendNext(formatPartialBoard());
    } else if (status == cols + 1) {
        var display = formatBoard(board);
        var evalResult = evaluateBoard(board);
        var winnings = evalResult.total;
        var tax = Math.floor(winnings * taxRate);
        var net = winnings - tax;

        display += "\r\nResults Summary:\r\n";
        if (evalResult.lines.length > 0) {
            for (var i = 0; i < evalResult.lines.length; i++) {
                display += evalResult.lines[i].msg + "\r\n";
            }
            display += "\r\nTotal: " + formatNumber(winnings) + " mesos\r\n";
            display += "Tax (15%): -" + formatNumber(tax) + " mesos\r\n";
            display += "Net payout: " + formatNumber(net) + " mesos";
            if (net > 0) {
                cm.gainMeso(net);
            }
        } else {
            display += "No winning lines this spin.";
        }
        cm.sendOk(display);
        cm.dispose();
    }
}

function randomizeSymbolWeights() {
    var weights = [];
    var totalWeight = 0;
    for (var i = 0; i < baseSymbols.length; i++) {
        var w = 1 + Math.floor(Math.random() * 8);
        weights.push(w);
        totalWeight += w;
    }
    var probs = [];
    var accum = 0;
    for (var i = 0; i < weights.length; i++) {
        accum += weights[i] / totalWeight;
        probs.push(accum);
    }
    return { weights: weights, probs: probs };
}

function generateBoard() {
    var b = [];
    for (var r = 0; r < rows; r++) {
        b[r] = [];
        for (var c = 0; c < cols; c++) {
            var cell = getRandomSymbolWeighted();
            cell._row = r;
            cell._col = c;
            b[r][c] = cell;
        }
    }
    return b;
}

// -- Multiplier odds changed here --
function getRandomSymbolWeighted() {
    // Only about 1.5% chance for a multiplier now!
    if (Math.random() < 0.985) {
        var roll = Math.random();
        for (var i = 0; i < baseSymbols.length; i++) {
            if (roll < symbolWeights.probs[i]) {
                var sym = baseSymbols[i];
                return { id: sym.id, mult: 0, payout: sym.payout, name: sym.name };
            }
        }
        var last = baseSymbols[baseSymbols.length - 1];
        return { id: last.id, mult: 0, payout: last.payout, name: last.name };
    } else {
        var pick = multiplierSymbols[Math.floor(Math.random() * multiplierSymbols.length)];
        return { id: pick[0], mult: pick[1], payout: 0, name: pick[1] + "x" };
    }
}

function formatPartialBoard() {
    var lines = [];
    for (var r = 0; r < rows; r++) {
        var row = [];
        for (var c = 0; c < cols; c++) {
            row.push(c <= revealCol ? "#v" + board[r][c].id + "#" : "[?]");
        }
        lines.push(row.join(" "));
    }
    return lines.join("\r\n");
}

function formatBoard(bd) {
    var lines = [];
    for (var r = 0; r < rows; r++) {
        var row = [];
        for (var c = 0; c < cols; c++) {
            row.push("#v" + bd[r][c].id + "#");
        }
        lines.push(row.join(" "));
    }
    return lines.join("\r\n");
}

function evaluateBoard(bd) {
    var total = 0, lines = [];
    var paidCells = {};

    function cellKey(r, c) { return r + "," + c; }

    function symbolStr(cell) {
        if (cell.mult > 0 && multiplierValueToId[cell.mult]) {
            return "#v" + multiplierValueToId[cell.mult] + "#";
        }
        return "#v" + cell.id + "#";
    }

    function isNewHit(cellList) {
        for (var i = 0; i < cellList.length; i++) {
            if (paidCells[cellList[i]]) return false;
        }
        return true;
    }
    function markHit(cellList) {
        for (var i = 0; i < cellList.length; i++) {
            paidCells[cellList[i]] = true;
        }
    }

    // STACKING MULTIPLIERS VERSION
   function processLine(cells) {
    for (var start = 0; start < cells.length; start++) {
        // Only start at a base symbol
        if (!cells[start] || cells[start].mult !== 0) continue;
        var anchor = cells[start];

        // Look forward: see how many consecutive same-symbols, allowing multipliers inline
        var count = 1;
        var mult = 1;
        var multIcons = "";
        var hitCells = [cellKey(anchor._row, anchor._col)];
        var iconStr = symbolStr(anchor) + " ";
        var j = start + 1;
        while (j < cells.length) {
            var cell = cells[j];
            if (!cell) break;
            if (cell.id === anchor.id && cell.mult === 0) {
                count++;
                iconStr += symbolStr(cell) + " ";
                hitCells.push(cellKey(cell._row, cell._col));
            } else if (cell.mult > 0) {
                mult *= cell.mult;
                multIcons += symbolStr(cell) + " ";
                iconStr += symbolStr(cell) + " ";
                hitCells.push(cellKey(cell._row, cell._col));
            } else {
                break;
            }
            j++;
        }
        // Trailing multipliers
        while (j < cells.length && cells[j] && cells[j].mult > 0) {
            mult *= cells[j].mult;
            multIcons += symbolStr(cells[j]) + " ";
            iconStr += symbolStr(cells[j]) + " ";
            hitCells.push(cellKey(cells[j]._row, cells[j]._col));
            j++;
        }
        // Only pay for run if it's 3+ and hasn't been paid already (use *first* cell of hit as anchor)
        if (count >= 3 && isNewHit(hitCells)) {
            markHit(hitCells);
            var payout = anchor.payout * count * mult;
            total += payout;
            var msg = iconStr.trim() + (mult > 1 ? " x " + multIcons.trim() : "")
                    + "    " + formatNumber(anchor.payout) + " x " + count
                    + (mult > 1 ? " x " + mult : "")
                    + " = " + formatNumber(payout);
            lines.push({ msg: msg, amount: payout });
            // Do NOT "start = j" here; allow overlapping (for diagonal/vertical etc) with new anchors
        }
    }
}


    // Process rows, columns, diagonals
    for (var r = 0; r < rows; r++) processLine(bd[r]);
    for (var c = 0; c < cols; c++) {
        var col = [];
        for (var r = 0; r < rows; r++) col.push(bd[r][c]);
        processLine(col);
    }
    var diag1 = [];
    for (var i = 0; i < rows; i++) diag1.push(bd[i][i]);
    processLine(diag1);
    var diag2 = [];
    for (var i = 0; i < rows; i++) diag2.push(bd[i][cols - 1 - i]);
    processLine(diag2);

    return { total: total, lines: lines };
}

function formatNumber(num) {
    var str = "" + num;
    var result = "";
    var count = 0;
    for (var i = str.length - 1; i >= 0; i--) {
        result = str.charAt(i) + result;
        count++;
        if (count == 3 && i != 0) {
            result = "," + result;
            count = 0;
        }
    }
    return result;
}
