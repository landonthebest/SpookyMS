var status = 0, sel = -1;
var shopItems = [
    [5211049, 200, "7-Eleven 2x EXP Card"],
    [5077000, 100, "Triple Megaphone"],
    [5520000, 500, "Scissors of Karma"],
    [2022179, 700, "Onyx Apple"],
    [2022183, 150, "Flower Shower"],
    [1012098, 75, "Maple Leaf"],
    [1302022, 25, "Bamboo Sword"]
];

function start() {
    status = 0;
    sel = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode < 1) {
        cm.dispose();
        return;
    }
    status++;

    var slayerTasks = cm.getAllSlayerTasks() || [];
    
    if (status == 1) {
        var menu =
            "#e#dRuneScape #rSlayer Guild#n#k\r\n" +
            "#dWelcome, adventurer. What brings you to the Slayer Guild?#k\r\n\r\n" +
            "#b#L0#Take on a Slayer Assignment#l\r\n" +
            "#g#L1#Hand in completed Slayer Task#l\r\n" +
            "#e#L2#View Slayer Stats#l\r\n" +
            "#r#L3#Browse Slayer Shop#l";
        cm.sendSimple(menu);
    } else if (status == 2) {
        sel = selection;
        if (sel == 0) { // Accept/View Task
            var taskId = Number(cm.getSlayerTaskMonsterId()) || 0,
                prog = Number(cm.getSlayerTaskProgress()) || 0,
                goal = Number(cm.getSlayerTaskGoal()) || 0,
                lvl = Number(cm.getSlayerLevel()) || 0;
            if (taskId > 0) {
                var t = null;
                for (var i = 0; i < slayerTasks.length; i++) {
                    if (slayerTasks[i].id == taskId) { t = slayerTasks[i]; break; }
                }
                var dynamicPts = (t && goal > 0) ? cm.calculateSlayerPoints(goal, t.level) : "?";
                cm.sendOk(
                    "#e#dCurrent Assignment#n#k\r\n" +
                    "#d-----------------------#k\r\n" +
                    "#bTarget:#k #e" + (t ? t.name : "?") + "#n\r\n" +
                    "#bProgress:#k #e" + prog + " / " + goal + "#n\r\n" +
                    "#gReward on Completion:#k #e" + dynamicPts + " Slayer Points#n\r\n" +
                    "#d#eStay vigilant and return victorious!#n#k"
                );
                cm.dispose();
            } else {
                // No task, assign one
                var eligible = [];
                for (var i = 0; i < slayerTasks.length; i++) {
                    var task = slayerTasks[i];
                    if (lvl >= task.level && typeof task.goalMin === "number" && typeof task.goalMax === "number" && task.goalMin > 0 && task.goalMax >= task.goalMin) {
                        eligible.push(task);
                    }
                }
                if (!eligible.length) {
                    cm.sendOk("#rThere are no Slayer assignments for your level yet. Train and return for greater challenges!#k");
                    cm.dispose();
                    return;
                }
                var t = eligible[Math.floor(Math.random() * eligible.length)];
                var min = t.goalMin, max = t.goalMax;
                var randGoal = min + Math.floor(Math.random() * (max - min + 1));
                var dynamicPts = cm.calculateSlayerPoints(randGoal, t.level);

                cm.setSlayerTaskMonsterId(t.id);
                cm.setSlayerTaskGoal(randGoal);
                cm.setSlayerTaskProgress(0);

                cm.sendOk(
                    "#e#gA new Slayer assignment has been bestowed upon you!#n#k\r\n" +
                    "#d-----------------------#k\r\n" +
                    "#bTarget:#k #e" + t.name + "#n\r\n" +
                    "#bGoal:#k #e" + randGoal + "#n\r\n" +
                    "#gReward:#k #e" + dynamicPts + " Slayer Points#n\r\n" +
                    "#d#eHunt well, Slayer. Return when your duty is complete!#n#k"
                );
                cm.dispose();
            }

        } else if (sel == 1) { // Turn In Task
    var taskId = Number(cm.getSlayerTaskMonsterId()) || 0,
        prog = Number(cm.getSlayerTaskProgress()) || 0,
        goal = Number(cm.getSlayerTaskGoal()) || 0,
        t = null;
    for (var i = 0; i < slayerTasks.length; i++) {
        if (slayerTasks[i].id == taskId) { t = slayerTasks[i]; break; }
    }
    if (taskId > 0 && prog >= goal && t && goal > 0) {
        var slayerExp = 10 * t.level,
            playerExp = slayerExp * 4,
            slayerPoints = cm.calculateSlayerPoints(goal, t.level);

        // Capture old stats BEFORE reward
        var oldSlayerExp = cm.getSlayerExp() || 0;
        var oldSlayerLvl = cm.getSlayerLevel() || 0;
        var oldSlayerPoints = cm.getSlayerPoints() || 0;
        var oldPlayerExp = cm.getPlayer().getExp ? cm.getPlayer().getExp() : 0; // Optional: your EXP getter

        // Give rewards
        cm.setSlayerTaskMonsterId(0);
        cm.setSlayerTaskGoal(0);
        cm.setSlayerTaskProgress(0);
        cm.addSlayerExp(slayerExp);
        cm.setSlayerPoints(oldSlayerPoints + slayerPoints);
        if (cm.gainExp) cm.gainExp(playerExp);
        else if (cm.gainPlayerExp) cm.gainPlayerExp(playerExp);

        // Get new stats AFTER reward
        var newSlayerExp = cm.getSlayerExp() || 0;
        var newSlayerLvl = cm.getSlayerLevel() || 0;
        var newSlayerPoints = cm.getSlayerPoints() || 0;
        var newPlayerExp = cm.getPlayer().getExp ? cm.getPlayer().getExp() : 0; // Optional

        cm.sendOk(
            "#e#bAssignment Complete!#n#k\r\n" +
            "#d-----------------------#k\r\n" +
            "#g+ " + slayerExp + " Slayer EXP#k\r\n" +
            "#b+ " + playerExp + " EXP#k\r\n" +
            "#r+ " + slayerPoints + " Slayer Points#k\r\n" +
            "#d-----------------------#k\r\n" +
            "#gRewards Gained:#k\r\n" +

			            "#gSlayer Level:#k   " + oldSlayerLvl + "   ->   " + newSlayerLvl + "\r\n" +
            "#gSlayer EXP:#k     " + oldSlayerExp + "   ->   " + newSlayerExp + "\r\n" +
            "#gSlayer Points:#k  " + oldSlayerPoints + "   ->   " + newSlayerPoints + "\r\n" +
            "#bChar EXP:#k       " + oldPlayerExp + "   ->   " + newPlayerExp + "\r\n" +
            "#d#eClaim your next assignment when ready.#n#k"
        );
        cm.dispose();
    } else {
        cm.sendOk("#rYou have no completed Slayer assignment to turn in.#k\r\n#dFinish your current task and return to claim your reward.#k");
        cm.dispose();
    }
} else if (sel == 2) { // Slayer Stats
            cm.sendOk(
                "#e#dYour Slayer Progress#n#k\r\n" +
                "#d-----------------------#k\r\n" +
                "#bLevel:#k #e" + (cm.getSlayerLevel() || 0) + "#n\r\n" +
                "#bEXP:#k #e" + (cm.getSlayerExp() || 0) + "#n\r\n" +
                "#gSlayer Points:#k #e" + (cm.getSlayerPoints() || 0) + "#n"
            );
            cm.dispose();

        } else if (sel == 3) { // Slayer Shop
            var pts = cm.getSlayerPoints() || 0;
            var msg = "#e#rSlayer Shop#n#k\r\n" +
                "#dHere you may trade your hard-earned Slayer Points for rare items.#k\r\n" +
                "#d-----------------------#k\r\n" +
                "#bYour Points:#k #e" + pts + "#n\r\n\r\n";
            for (var i = 0; i < shopItems.length; i++)
                msg += "#L" + i + "##e" + shopItems[i][2] + "#n #k- #r" + shopItems[i][1] + " Points#k#l\r\n";
            status = 9; // jump to shop handler
            cm.sendSimple(msg);
        }
    }
    // Shop Handler (status == 10 after sendSimple above)
    else if (status == 10) {
        var i = selection, item = shopItems[i], ptsNow = cm.getSlayerPoints() || 0;
        if (!item) {
            cm.sendOk("#rThat is not a valid selection. Please try again.#k");
            cm.dispose();
            return;
        }
        if (ptsNow >= item[1]) {
            cm.setSlayerPoints(ptsNow - item[1]);
            if (cm.gainItem) cm.gainItem(item[0], 1);
            cm.sendOk(
                "#e#gPurchase successful!#n#k\r\n" +
                "#d-----------------------#k\r\n" +
                "#bAcquired:#k #e" + item[2] + "#n\r\n" +
                "#rSpent:#k " + item[1] + " Slayer Points"
            );
            cm.dispose();
        } else {
            cm.sendOk(
                "#rYou do not have enough Slayer Points for that item.#k\r\n" +
                "#dComplete more assignments to earn greater rewards!#k"
            );
            cm.dispose();
        }
    }
}
