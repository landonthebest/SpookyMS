/*
 * Casino Slot Machine NPC
 * @NPC: 9901000
 * Maplestory v83 compatible
 * 5×5 slot, reveals one column per Next, supports horizontal + two diagonal wins.
 */

var status = 0;
var rows   = 5;
var cols   = 5;
var spinCost = 1000; // meso cost per spin
var baseWin  = 100;  // base meso payout per symbol in a winning line

var baseSymbols = [
    4310015, 4310016, 4310017, 4310018, 4310019,
    4310021, 4310022, 4310023
];
var multiplierSymbols = [
    [4310027, 2],
    [4310028, 3],
    [4310029, 4]
];

// holds state between action() calls
var board;
var revealCol;  // which column is currently revealed (0-based)

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
        return;
    }
    if (mode == 0 && status == 0) {
        cm.dispose();
        return;
    }
    status += (mode == 1 ? 1 : -1);

    if (status == 0) {
        cm.sendYesNo("Spin the slot machine for " + spinCost + " mesos?");
    }
    else if (status == 1) {
        // Deduct cost and initialize
        if (cm.getMeso() < spinCost) {
            cm.sendOk("You don't have enough mesos.");
            cm.dispose();
            return;
        }
        cm.gainMeso(-spinCost);
        board     = generateBoard();
        revealCol = 0;           // start by showing column 0
        cm.sendNext(formatPartialBoard());
    }
    else if (status >= 2 && status <= cols) {
        // reveal the next column each Next
        revealCol++;
        cm.sendNext(formatPartialBoard());
    }
    else if (status == cols + 1) {
        // all columns are now revealed – show full board + evaluate
        var display  = formatBoard(board);
        var winnings = evaluate(board);
        if (winnings > 0) {
            cm.gainMeso(winnings);
            display += "\r\nYou won " + winnings + " mesos!";
        } else {
            display += "\r\nNo win this time.";
        }
        cm.sendOk(display);
        cm.dispose();
    }
}

/** Fills a 5×5 array with random symbols + potential multipliers */
function generateBoard() {
    var b = [];
    for (var r = 0; r < rows; r++) {
        b[r] = [];
        for (var c = 0; c < cols; c++) {
            b[r][c] = getRandomSymbol();
        }
    }
    return b;
}

function getRandomSymbol() {
    if (Math.random() < 0.75) {
        var idx = Math.floor(Math.random() * baseSymbols.length);
        return { id: baseSymbols[idx], mult: 0 };
    } else {
        var pick = multiplierSymbols[
            Math.floor(Math.random() * multiplierSymbols.length)
        ];
        return { id: pick[0], mult: pick[1] };
    }
}

/** 
 * Show the board but only columns 0..revealCol; 
 * columns > revealCol are “[?]” 
 */
function formatPartialBoard() {
    var text = "";
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            if (c <= revealCol) {
                text += "#v" + board[r][c].id + "#   ";
            } else {
                text += "[?]   ";
            }
        }
        text = text.trim() + "\r\n";
    }
    return text;
}

/** Show entire 5×5 board with extra spacing */
function formatBoard(bd) {
    var txt = "";
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            txt += "#v" + bd[r][c].id + "#   ";
        }
        txt = txt.trim() + "\r\n";
    }
    return txt;
}

/** Evaluate horizontal lines + two main diagonals */
function evaluate(bd) {
    var total = 0;

    function countLine(cells) {
        var baseId = -1, count = 0, multi = 0;
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            if (cell.mult > 0) {
                multi += cell.mult;
            } else {
                if (baseId == -1) baseId = cell.id;
                if (cell.id == baseId) {
                    count++;
                } else {
                    break;
                }
            }
        }
        if (count >= 3) {
            var m = (multi > 0 ? multi : 1);
            return baseWin * count * m;
        }
        return 0;
    }

    // horizontal rows
    for (var r = 0; r < rows; r++) {
        total += countLine(bd[r]);
    }

    // primary diagonal (0,0)->(4,4)
    var diag1 = [];
    for (var i = 0; i < rows; i++) {
        diag1.push(bd[i][i]);
    }
    total += countLine(diag1);

    // secondary diagonal (0,4)->(4,0)
    var diag2 = [];
    for (var i = 0; i < rows; i++) {
        diag2.push(bd[i][cols - 1 - i]);
    }
    total += countLine(diag2);

    return total;
}
