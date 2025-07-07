//Ironman test
//iron man medals 1142413 - start, 1142414 - middle, 1142415 - final

var status = 0;

function start() {
    status = 0;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
        return;
    }

    if (status == 0) {
        if (mode == 0) {
            cm.dispose();
            return;
        }
        if (cm.getPlayer().isIronman()) {
            cm.sendOk("You are already an Ironman.");
            cm.dispose();
            return;
        }
        cm.sendYesNo("#r---Ironman Challenge---#k\r\n\r\nWould you like to activate Ironman Mode? This is permanent and cannot be undone.\r\n"
            + "\r\n#b---Ironman Restrictions---#k"
            + "\r\n#b1.#k Only loot from monsters #ryou#k kill."
            + "\r\n#b2.#k Cannot party with others."
            + "\r\n#b3.#k Cannot trade or use player shops."
            + "\r\n#b4.#k Cannot access storage.");
        status = 1;
    } else if (status == 1) {
        if (mode == 0) {
            cm.sendOk("If you change your mind, come back anytime.");
            cm.dispose();
            return;
        }
        cm.sendYesNo("#rAre you REALLY sure you want to become an Ironman?#k\r\n\r\n"
            + "This decision is #epermanent#k and cannot be undone!");
        status = 2;
    } else if (status == 2) {
        if (mode == 0) {
            cm.sendOk("If you change your mind, come back anytime.");
            cm.dispose();
            return;
        }
        cm.getPlayer().setIronman(true);
        cm.getPlayer().saveToDB(true);
        cm.gainItem(1142414, 1);
        cm.sendOk("You are now an Ironman! Good luck on your journey.");
        cm.dispose();
    }
}