var slayerTasks = [
    {id: 100100, name: "Snail", level: 1, exp: 10, goal: 40, pts: 20},
    {id: 100101, name: "Blue Snail", level: 3, exp: 15, goal: 50, pts: 40},
    {id: 120100, name: "Shroom", level: 8, exp: 20, goal: 75, pts: 105},
    {id: 130100, name: "Stump", level: 12, exp: 30, goal: 130, pts: 200},
    {id: 130101, name: "Red Snail", level: 6, exp: 40, goal: 230, pts: 305},
    {id: 2220000, name: "Mano", level: 18, exp: 150, goal: 8, pts: 750}
];

var shopItems = [
    [5211049, 200, "7-Eleven 2x EXP Card"],
    [5077000, 100, "Triple Megaphone"],
    [5520000, 500, "Scissors of Karma"],
    [2022179, 700, "Onyx Apple"],
    [2022183, 150, "Flower Shower"],
    [1012098, 75, "Maple Leaf"],
    [1302022, 25, "Bamboo Sword"]
];

var status = 0, sel = -1, debug = true;

// --------------- Helpers (all at global scope) ---------------
function debugMsg(msg) {
    if (debug && typeof cm.logToConsole === "function") {
        cm.logToConsole("[SlayerNPC] " + msg);
    } else if (debug) {
        cm.sendOk("[Debug] " + msg);
    }
}

function getTaskName(id) {
    for (var i = 0; i < slayerTasks.length; i++)
        if (slayerTasks[i].id === id) return slayerTasks[i].name;
    return "Unknown";
}
function getTask(id) {
    for (var i = 0; i < slayerTasks.length; i++)
        if (slayerTasks[i].id === id) return slayerTasks[i];
    return null;
}

// Standalone level up checker for reward, returns new level
function levelUpCheckNoDialog() {
    var lvl = Number(cm.getSlayerLevel() || 1),
        exp = Number(cm.getSlayerExp() || 0),
        needed = 100 * lvl,
        up = false;
    debugMsg("Checking level up: lvl=" + lvl + " exp=" + exp + " needed=" + needed);
    while (exp >= needed) {
        exp -= needed;
        lvl++;
        up = true;
        needed = 100 * lvl;
    }
    cm.setSlayerLevel(lvl);
    cm.setSlayerExp(exp);
    if (up) debugMsg("Level up! New level: " + lvl + ", exp left: " + exp);
    return lvl;
}

// If you want the full dialog version for other menus
function levelUpCheck() {
    var lvl = Number(cm.getSlayerLevel() || 1),
        exp = Number(cm.getSlayerExp() || 0),
        needed = 100 * lvl,
        up = false;
    debugMsg("Checking level up: lvl=" + lvl + " exp=" + exp + " needed=" + needed);
    while (exp >= needed) {
        exp -= needed;
        lvl++;
        up = true;
        needed = 100 * lvl;
    }
    cm.setSlayerLevel(lvl);
    cm.setSlayerExp(exp);
    if (up) {
        cm.sendNext("#rSlayer Level Up!#k\r\nYou are now Slayer Level #b" + lvl + "#k!");
        debugMsg("Level up! New level: " + lvl + ", exp left: " + exp);
    }
}

// --------------------------------------------------------------

function start() {
    status = 0;
    sel = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode === -1 || mode === 0) {
        debugMsg("Dialog exited. Status: " + status + ", Sel: " + sel);
        cm.dispose();
        return;
    }
    if (mode === 1) status++;

    try {
        if (status === 1) {
            var menu =
                "#e#b========== SLAYER SYSTEM ==========#k#n\r\n" +
                "#bWelcome, brave warrior!#k\r\n\r\n" +
                "#L0##b-> View or Accept Slayer Task#k#l\r\n" +
                "#L1##r-> Turn In Completed Task#k#l\r\n" +
                "#L2##d-> View Slayer Stats#k#l\r\n" +
                "#L3##g-> Slayer Shop#k#l\r\n" +
                "#b====================================#k";
            cm.sendSimple(menu);
        }

        else if (status === 2) {
            sel = selection;
            debugMsg("Menu selection: " + sel);

            if (sel === 0) { // View/Accept
                var taskId = Number(cm.getSlayerTaskMonsterId() || 0);
                var prog = Number(cm.getSlayerTaskProgress() || 0);
                var goal = Number(cm.getSlayerTaskGoal() || 0);
                var lvl = Number(cm.getSlayerLevel() || 1);

                debugMsg("Checking task: taskId=" + taskId + " prog=" + prog + " goal=" + goal + " lvl=" + lvl);

                if (taskId > 0) {
                    cm.sendOk(
                        "#e#b[Current Slayer Task]#k#n\r\n" +
                        "#r" + getTaskName(taskId) + "#k\r\n" +
                        "Progress: #b" + prog + "#k / #b" + goal + "#k\r\n\r\n" +
                        "#gComplete the kills and return for your reward!#k"
                    );
                    cm.dispose();
                } else {
                    // Assign random eligible task
                    var choices = [];
                    for (var i = 0; i < slayerTasks.length; i++) {
                        if (lvl >= slayerTasks[i].level) choices.push(slayerTasks[i]);
                    }
                    debugMsg("Eligible task choices: " + JSON.stringify(choices));
                    if (choices.length === 0) {
                        cm.sendOk("No Slayer Tasks available for your level yet!");
                        cm.dispose();
                        return;
                    }
                    var task = choices[Math.floor(Math.random() * choices.length)];
                    cm.setSlayerTaskMonsterId(task.id);
                    cm.setSlayerTaskGoal(task.goal);
                    cm.setSlayerTaskProgress(0);

                    debugMsg("Assigned task: " + JSON.stringify(task));

                    cm.sendOk(
                        "#e#b[New Slayer Task]#k#n\r\n" +
                        "#r" + task.name + "#k\r\n" +
                        "Kill #b" + task.goal + "#k to complete."
                    );
                    cm.dispose();
                }
            }

            else if (sel === 1) { // Turn In
                var taskId = Number(cm.getSlayerTaskMonsterId() || 0);
                var prog = Number(cm.getSlayerTaskProgress() || 0);
                var goal = Number(cm.getSlayerTaskGoal() || 0);

                debugMsg("Turn-in: taskId=" + taskId + " prog=" + prog + " goal=" + goal);

                if (taskId > 0 && prog >= goal) {
                    var t = getTask(taskId);
                    if (!t) {
                        cm.sendOk("Error: Task data missing (ID: " + taskId + ").");
                        debugMsg("Turn-in error: missing task data for " + taskId);
                        cm.dispose();
                        return;
                    }

                    var slayerExp = 10 * t.level;
                    var playerExp = slayerExp * 4;
                    if (isNaN(slayerExp) || isNaN(playerExp)) {
                        cm.sendOk("Error: EXP calculation failed.");
                        debugMsg("EXP calculation error. t.level: " + t.level + ", slayerExp: " + slayerExp + ", playerExp: " + playerExp);
                        cm.dispose();
                        return;
                    }

                    // Reset before giving rewards
                    cm.setSlayerTaskMonsterId(0);
                    cm.setSlayerTaskGoal(0);
                    cm.setSlayerTaskProgress(0);

                    // Save old values for level check
                    var oldLvl = Number(cm.getSlayerLevel() || 1);
                    var oldExp = Number(cm.getSlayerExp() || 0);

                    cm.setSlayerExp(oldExp + slayerExp);
                    cm.setSlayerPoints(Number(cm.getSlayerPoints() || 0) + t.pts);

                    debugMsg("Awarding EXP. Slayer: +" + slayerExp + ", Player: +" + playerExp + ", Points: +" + t.pts);

                    // EXP grant fallback logic
                    if (typeof cm.gainExp === "function") {
                        cm.gainExp(playerExp);
                    } else if (typeof cm.gainPlayerExp === "function") {
                        cm.gainPlayerExp(playerExp);
                    } else {
                        debugMsg("No EXP function found on cm!");
                    }

                    // Check level up — but don't call cm.sendNext if already sending Ok
                    var newLvl = levelUpCheckNoDialog();
                    var msg =
                        "#e#bSlayer Task Completed!#k#n\r\n" +
                        "#g+ " + slayerExp + " Slayer EXP#k\r\n" +
                        "#r+ " + playerExp + " EXP#k\r\n" +
                        "#d+ " + t.pts + " Slayer Points#k";
                    if (newLvl > oldLvl) {
                        msg += "\r\n\r\n#rSlayer Level Up!#k\r\nYou are now Slayer Level #b" + newLvl + "#k!";
                    }
                    cm.sendOk(msg);
                    cm.dispose();
                } else {
                    cm.sendOk("You have no completed Slayer Task to turn in.");
                    debugMsg("Turn-in failed. taskId=" + taskId + ", prog=" + prog + ", goal=" + goal);
                    cm.dispose();
                }
            }

            else if (sel === 2) { // View Stats
                var msg =
                    "#e#d== Your Slayer Stats ==#k#n\r\n" +
                    "#bLevel:#k " + Number(cm.getSlayerLevel() || 1) + "\r\n" +
                    "#rEXP:#k " + Number(cm.getSlayerExp() || 0) + "\r\n" +
                    "#bPoints:#k " + Number(cm.getSlayerPoints() || 0) + "\r\n\r\n";
                debugMsg("Stats shown.");
                cm.sendOk(msg);
                cm.dispose();
            }

            else if (sel === 3) { // Slayer Shop
			var points = Number(cm.getSlayerPoints() || 0);
                var msg = "#e#bSlayer Shop:#k#n\r\n\r\n";
				 msg += "#dYour Slayer Points: #b" + points + "#k\r\n\r\n";
                for (var i = 0; i < shopItems.length; i++)
                    msg += "#L" + i + "##b" + shopItems[i][2] + "#k - #r" + shopItems[i][1] + "#k Points#l\r\n";
                debugMsg("Shop menu displayed.");
                cm.sendSimple(msg);
                status = 10;
            }

            else {
                cm.sendOk("Unknown menu selection: " + sel);
                debugMsg("Unknown selection in main menu: " + sel);
                cm.dispose();
            }
        }

        // Shop handling
        else if (status === 11) { // (status set to 10 before)
            var i = selection;
            debugMsg("Shop selection: " + i);
            if (typeof shopItems[i] === "undefined") {
                cm.sendOk("Invalid shop selection (" + i + ").");
                debugMsg("Shop index out of bounds: " + i);
                cm.dispose();
                return;
            }
            var itemId = shopItems[i][0],
                cost = shopItems[i][1],
                name = shopItems[i][2],
                pts = Number(cm.getSlayerPoints() || 0);

            debugMsg("Trying to buy " + name + " (" + itemId + ") for " + cost + " points (player has " + pts + ").");

            if (pts >= cost) {
                try {
                    cm.setSlayerPoints(pts - cost);
                    if (typeof cm.gainItem === "function") {
                        cm.gainItem(itemId, 1);
                        debugMsg("Gave itemId " + itemId + " x1 to player.");
                        cm.sendOk("Purchased #b" + name + "#k for #r" + cost + "#k Slayer Points!");
                    } else {
                        cm.sendOk("Shop error: gainItem() not implemented on server.");
                        debugMsg("gainItem() missing.");
                    }
                } catch (e) {
                    cm.sendOk("Error purchasing item. (" + e + ")");
                    debugMsg("gainItem error: " + e);
                }
            } else {
                cm.sendOk("You do not have enough Slayer Points!");
                debugMsg("Not enough points to buy " + name + ".");
            }
            cm.dispose();
        }
    }
    catch (err) {
        cm.sendOk("An unexpected error occurred: " + err);
        debugMsg("Caught JS exception: " + err);
        cm.dispose();
    }
}
