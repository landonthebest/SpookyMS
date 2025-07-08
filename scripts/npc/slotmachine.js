// npc/slotmachine.js – Crash-proof, short-dialog slot machine with bonus spins

var status = -1;
var cost = 4310024;

var slot = [];
var inFreeSpins = false;
var freeSpins = 0;
var freeSpinRewards = 0;
var freeSpinStep = 0;
var thisSpinBonusAmt = 0; // number of spins this bonus awards
var breakdownLines = null, breakdownIdx = 0, breakdownTotal = 0, breakdownMeso = 0, inBreakdown = false;

var bonusSymbol = "#v4310026#";
var icons_normal = [
    "#v4310015#","#v4310016#","#v4310017#","#v4310018#","#v4310019#",
    "#v4310021#","#v4310022#","#v4310023#"
];
var icons_multipliers = [
    "#v4310027#","#v4310028#","#v4310029#"
];
var MULTIPLIERS = {
    "#v4310027#": 2,
    "#v4310028#": 3,
    "#v4310029#": 4,
    "#v4310026#": 1
};
var ALL_ICONS = icons_normal.concat(icons_multipliers).concat([bonusSymbol]);

function start() {
    status = -1;
    inFreeSpins = false;
    freeSpins = 0;
    freeSpinRewards = 0;
    freeSpinStep = 0;
    thisSpinBonusAmt = 0;
    breakdownLines = null; breakdownIdx = 0; breakdownTotal = 0; breakdownMeso = 0; inBreakdown = false;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode != 1) return cm.dispose();

    // Handle chunked breakdown dialog first
    if (inBreakdown) {
        showBreakdown();
        return;
    }

    status++;

    if (inFreeSpins) {
        handleFreeSpinFlow();
        return;
    }

    if (status == 0) {
        var msg = "#v4310020#\r\n#eSLOT MACHINE#n\r\n";
        msg += "#L1##bSpin#l#k (Cost: #i" + cost + "# x1)\r\n";
        cm.sendSimple(msg);

    } else if (status == 1) {
        if (!cm.haveItem(cost)) {
            cm.sendOk("You don't have any #i" + cost + "#.");
            return cm.dispose();
        }
        cm.gainItem(cost, -1);
        spinSlot(false);
        cm.sendNext(displaySlot(0));

    } else if (status >= 2 && status <= 6) {
        cm.sendNext(displaySlot(status - 1));

    } else if (status == 7) {
        var grid = displaySlot(5);
        var result = calculateLineRewards();
        var bonusCount = countBonusWilds();
        var msg = "#v4310020#\r\n#e#rSLOT MACHINE#k#n\r\n" + grid + "\r\n";

        if (bonusCount >= 3) {
            freeSpins = (bonusCount == 3) ? 10 : (bonusCount == 4 ? 14 : 20);
            freeSpins = Math.min(freeSpins, 20);
            inFreeSpins = true;
            freeSpinRewards = 0;
            freeSpinStep = 0;
            thisSpinBonusAmt = freeSpins;

            msg += "#e#bBONUS!#k You hit " + bonusCount + " bonus symbols!\r\n";
            msg += "#fs14##r" + freeSpins + " FREE SPINS AWARDED!#k#n\r\n";
            msg += "#fs12#(No bonus symbols in free spins, multipliers boosted!)";
            cm.sendNext(msg);

        } else {
            if (result.lines.length > 0) {
                // Chunked breakdown dialog
                breakdownLines = result.breakdown.split("\r\n");
                breakdownIdx = 0;
                breakdownTotal = breakdownLines.length;
                breakdownMeso = result.totalMesos;
                inBreakdown = true;
                showBreakdown();
                return;
            } else {
                msg += "No lines matched. Better luck next time!";
                cm.sendOk(msg);
                cm.dispose();
            }
        }
    }
}

// Chunked breakdown dialog to avoid Maple client crash
function showBreakdown() {
    var msg = "#v4310020#\r\n#e#rSLOT MACHINE#k#n\r\n";
    var linesThis = 0;
    while (breakdownIdx < breakdownTotal && linesThis < 3) {
        if (breakdownLines[breakdownIdx]) {
            msg += breakdownLines[breakdownIdx] + "\r\n";
            linesThis++;
        }
        breakdownIdx++;
    }
    // Last chunk
    if (breakdownIdx >= breakdownTotal) {
        msg += "\r\n#eTotal Won: #r" + formatNumber(breakdownMeso) + "#k Mesos!#n";
        cm.gainMeso(breakdownMeso);
        inBreakdown = false;
        cm.sendOk(msg);
        cm.dispose();
    } else {
        msg += "#g(Next...)\r\n";
        cm.sendNext(msg);
    }
}

// === FREE SPIN FLOW ===
function handleFreeSpinFlow() {
    if (freeSpinStep === 0) {
        spinSlot(true); // free spin slot
    }
    if (freeSpinStep < 6) {
        cm.sendNext(displaySlot(freeSpinStep));
        freeSpinStep++;
        return;
    }

    // Show result
    var grid = displaySlot(5);
    var result = calculateLineRewards();
    var won = result.totalMesos;
    var idx = thisSpinBonusAmt - freeSpins + 1;
    var msg = "#v4310020#\r\n" +
              "#e#bFREE SPIN " + idx + " / " + thisSpinBonusAmt + "#k#n\r\n" +
              grid + "\r\n";
    var bLines = result.breakdown.split("\r\n");
    var linesShown = 0;
    for (var i = 0; i < bLines.length && linesShown < 3; i++) {
        if (bLines[i]) {
            msg += bLines[i] + "\r\n";
            linesShown++;
        }
    }
    if (bLines.length > 3) msg += "(and more...)\r\n";
    if (result.lines.length > 0) {
        msg += "\r\n#eSpin Won: #r" + formatNumber(won) + "#k Mesos!#n";
    } else {
        msg += "No lines matched this spin.";
    }
    cm.sendNext(msg);

    freeSpinRewards += won;
    freeSpins--;
    freeSpinStep = 0;

    if (freeSpins > 0) {
        return;
    }

    var summary =
        "#e#bBONUS ROUND COMPLETE!#k#n\r\n" +
        "You won a total of #r" + formatNumber(freeSpinRewards) + "#k Mesos from free spins!";
    cm.sendOk(summary);
    cm.gainMeso(freeSpinRewards);

    inFreeSpins = false;
    freeSpinRewards = 0;
    freeSpins = 0;
    thisSpinBonusAmt = 0;
    cm.dispose();
}

// --- CORE SLOT LOGIC (unchanged except defensive grid filling) ---

function spinSlot(isFreeSpin) {
    slot = [];
    var i, j, pool = [], weights = {};

    if (!isFreeSpin) {
        // Normal: High bonus symbol, normal others
        for (i = 0; i < icons_normal.length; i++) {
            weights[icons_normal[i]] = 5 + Math.floor(Math.random() * 6);
        }
        for (i = 0; i < icons_multipliers.length; i++) {
            weights[icons_multipliers[i]] = 2 + Math.floor(Math.random() * 2);
        }
        weights[bonusSymbol] = 8 + Math.floor(Math.random() * 4);
    } else {
        // Free: NO bonus symbols, only hot normal & boosted multipliers
        for (i = 0; i < icons_normal.length; i++) {
            weights[icons_normal[i]] = 12 + Math.floor(Math.random() * 10);
        }
        for (i = 0; i < icons_multipliers.length; i++) {
            weights[icons_multipliers[i]] = 7 + Math.floor(Math.random() * 5);
        }
        weights[bonusSymbol] = 0;
    }

    var iconsLoop = isFreeSpin
        ? icons_normal.concat(icons_multipliers)
        : ALL_ICONS;

    for (i = 0; i < iconsLoop.length; i++) {
        var sym = iconsLoop[i];
        for (j = 0; j < (weights[sym] || 0); j++) {
            pool.push(sym);
        }
    }
    if (pool.length < 10) {
        for (i = 0; i < icons_normal.length; i++) {
            for (var k = 0; k < 3; k++) pool.push(icons_normal[i]);
        }
    }
    if (pool.length === 0) {
        for (var f = 0; f < 25; f++) pool.push(icons_normal[0]);
    }

    for (i = 0; i < 5; i++) {
        slot[i] = [];
        for (j = 0; j < 5; j++) {
            slot[i][j] = pool[Math.floor(Math.random() * pool.length)];
        }
    }
}

function displaySlot(col) {
    var out = "";
    for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 5; c++) {
            if (slot[r] && typeof slot[r][c] !== "undefined" && c < col) {
                out += slot[r][c];
            } else {
                out += "-";
            }
        }
        out += "\r\n";
    }
    return out;
}

function countBonusWilds() {
    var cnt = 0;
    for (var r = 0; r < 5; r++) {
        if (!slot[r]) continue;
        for (var c = 0; c < 5; c++) {
            if (slot[r][c] === bonusSymbol) cnt++;
        }
    }
    return cnt > 6 ? 6 : cnt;
}

function calculateLineRewards() {
    var matchedLines = [];
    var totalMesos = 0;
    var breakdown = "";
    var lines = [], i, r, c, d;

    for (i = 0; i < 5; i++) {
        lines.push({type:"row", idx:i});
        lines.push({type:"col", idx:i});
    }
    lines.push({type:"diag", idx:0});
    lines.push({type:"adiag", idx:0});

    for (i = 0; i < lines.length; i++) {
        var ld = lines[i];
        var syms = [];
        if (ld.type == "row") for (c = 0; c < 5; c++) syms.push(slot[ld.idx][c]);
        else if (ld.type == "col") for (r = 0; r < 5; r++) syms.push(slot[r][ld.idx]);
        else if (ld.type == "diag") for (d = 0; d < 5; d++) syms.push(slot[d][d]);
        else for (d = 0; d < 5; d++) syms.push(slot[d][4-d]);

        var base = null, broken = false;
        for (var s = 0; s < syms.length; s++) {
            if (arrayIndexOf(icons_normal, syms[s]) != -1) {
                if (!base) base = syms[s];
                else if (syms[s] != base) { broken = true; break; }
            }
        }
        if (!broken && base) {
            var mult = getWildLineMultiplier(syms);
            var reward = 50000 * mult;
            matchedLines.push({line:ld, reward:reward});
            breakdown += "Matched " + describeLine(ld)
                + " [" + getWildLineText(syms) + "] x" + mult
                + ": #b" + formatNumber(reward) + "#k\r\n";
            totalMesos += reward;
        }
    }

    if (matchedLines.length >= 2 && matchedLines.length <= 4) {
        var extraArr = [0,0,50000,100000,200000];
        var extra = extraArr[matchedLines.length] || 0;
        if (extra) {
            totalMesos += extra;
            breakdown += "#eMulti‐Line Bonus: #b" + formatNumber(extra) + "#k#n\r\n";
        }
    }
    return { lines: matchedLines, totalMesos: totalMesos, breakdown: breakdown };
}

function getWildLineMultiplier(syms) {
    var m = 1;
    for (var i = 0; i < syms.length; i++) {
        m *= (MULTIPLIERS[syms[i]] || 1);
    }
    return m;
}
function getWildLineText(syms) { return syms.join(""); }
function describeLine(l) {
    if (l.type == "row")   return "Row " + (l.idx+1);
    if (l.type == "col")   return "Col " + (l.idx+1);
    if (l.type == "diag")  return "Main Diagonal";
    if (l.type == "adiag") return "Anti‐Diagonal";
    return "";
}
function formatNumber(n) {
    var s = "" + n, out = "", cnt = 0;
    for (var i = s.length - 1; i >= 0; i--) {
        out = s.charAt(i) + out;
        if (++cnt % 3 == 0 && i != 0) out = "," + out;
    }
    return out;
}
function arrayIndexOf(arr, val) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) return i;
    }
    return -1;
}
