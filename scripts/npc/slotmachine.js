// slotmachine.js - 5x5 slot (CosmicMS safe, weighted "live" spins + rig toggle)
var status = -1, cost = 4310024;
var RIG_ENABLED = true; // Set to true to enable line rigging
var slot = [];
var icons = [
    "#v4310015#", "#v4310016#", "#v4310017#", "#v4310018#", "#v4310019#",
    "#v4310021#", "#v4310022#", "#v4310023#"
];

function start() { status = -1; action(1, 0, 0); }

function action(mode, type, sel) {
    if (mode == -1 || status == -2) return cm.dispose();
    if (status == 0 && mode == 0) return cm.dispose();
    status += (mode == 1 ? 1 : -1);

    if (status == 0) {
			if (!cm.haveItem(cost)) return cm.sendOk("You don't have any #i" + cost + "#."), cm.dispose();
        cm.sendYesNo("#v4310020#\r\nSpin cost: #i" + cost + "# x1\r\n\r\nSpin?");
    } else if (status == 1) {
        if (!cm.haveItem(cost)) return cm.sendOk("You don't have any #i" + cost + "#."), cm.dispose();
        cm.gainItem(cost, -1);
        spinSlot();
        cm.sendNext(displaySlot(0));
    } else if (status >= 2 && status <= 6) {
        cm.sendNext(displaySlot(status - 1));
    } else if (status == 7) {
        var msg = "#v4310020#\r\n#e#rSLOT MACHINE#k#n\r\n" + displaySlot(5) + "\r\n";
        var lines = countLines(), mesos = 0;
        if (isFullScreen())      { mesos = 500000000; msg += "#e#bFULL SCREEN JACKPOT!#k#n You win #r500,000,000#k mesos!"; }
        else if (lines == 4)     { mesos = 1200000; msg += "#e#b4X LINE JACKPOT!#k#n You win #r1,200,000#k mesos!"; }
        else if (lines == 3)     { mesos = 450000;  msg += "#e#bTRIPLE LINE JACKPOT!#k#n You win #r450,000#k mesos!"; }
        else if (lines == 2)     { mesos = 150000;  msg += "#e#bDOUBLE LINE JACKPOT!#k#n You win #r150,000#k mesos!"; }
        else if (lines == 1)     { mesos = 50000;   msg += "#bYou matched a line!#k You win #r50,000#k mesos!"; }
        else                     { msg += "No lines matched. Better luck next time!"; }
        if (mesos) cm.gainMeso(mesos);
        cm.sendOk(msg); cm.dispose();
    }
}

function spinSlot() {
    var useWeighted = Math.random() < 0.5;
    var chosenIcons = icons;
    if (useWeighted) {
        var picks = [];
        while (picks.length < 3) {
            var pick = icons[Math.floor(Math.random() * icons.length)];
            if (picks.indexOf(pick) === -1) picks.push(pick);
        }
        chosenIcons = [];
        for (var i = 0; i < icons.length; i++) {
            var mult = (picks.indexOf(icons[i]) !== -1) ? 7 : 1;
            for (var j = 0; j < mult; j++) chosenIcons.push(icons[i]);
        }
    }

    slot = Array(5).fill().map(_ => Array(5).fill().map(_ => chosenIcons[Math.floor(Math.random() * chosenIcons.length)]));
    if (!RIG_ENABLED) return;

    // --- Rig for guaranteed lines, each line gets its own symbol ---
    var r = Math.random(), l = 0;
    if      (r < 0.01) l = 5;
    else if (r < 0.08) l = 4;
    else if (r < 0.15) l = 3;
    else if (r < 0.25) l = 2;
    else if (r < 0.35) l = 1;
    if (!l) return;
    var lines = [];
    for (var r = 0; r < 5; r++) lines.push({type:"row",i:r});
    for (var c = 0; c < 5; c++) lines.push({type:"col",i:c});
    lines.push({type:"diag",i:0}, {type:"adiag",i:0});

    if (l == 5) {
        var symbol = icons[Math.floor(Math.random()*icons.length)];
        for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) slot[r][c] = symbol;
    } else {
        var used = {};
        while (Object.keys(used).length < l && lines.length) {
            var idx = Math.floor(Math.random()*lines.length), line = lines[idx];
            if (!used[line.type+line.i]) {
                used[line.type+line.i] = true;
                var symbol = icons[Math.floor(Math.random()*icons.length)];
                if (line.type=="row")  for (var c=0; c<5; c++) slot[line.i][c]=symbol;
                if (line.type=="col")  for (var r=0; r<5; r++) slot[r][line.i]=symbol;
                if (line.type=="diag")   for (var i=0; i<5; i++) slot[i][i]=symbol;
                if (line.type=="adiag")  for (var i=0; i<5; i++) slot[i][4-i]=symbol;
            }
            lines.splice(idx,1);
        }
    }
}


function displaySlot(n) {
    var out = "";
    for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 5; c++) out += (c < n ? slot[r][c] : "-");
        out += "\r\n";
    }
    return out;
}
function isFullScreen() {
    var f = slot[0][0];
    for (var r=0;r<5;r++) for (var c=0;c<5;c++) if(slot[r][c]!=f) return false;
    return true;
}
function countLines() {
    var l=0;
    for (var r=0;r<5;r++) if (allSame(slot[r][0],slot[r][1],slot[r][2],slot[r][3],slot[r][4])) l++;
    for (var c=0;c<5;c++) if (allSame(slot[0][c],slot[1][c],slot[2][c],slot[3][c],slot[4][c])) l++;
    if (allSame(slot[0][0],slot[1][1],slot[2][2],slot[3][3],slot[4][4])) l++;
    if (allSame(slot[0][4],slot[1][3],slot[2][2],slot[3][1],slot[4][0])) l++;
    return l;
}
function allSame() {
    for (var i=1;i<arguments.length;i++) if(arguments[i]!=arguments[0]) return false;
    return true;
}
