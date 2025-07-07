var ringId = 1112942;
var status = 0;

function start() {
    status = 0;
    var options = "What would you like to do?\r\n";
    options += "#L0#Get Ring#l\r\n";
    options += "#L1#Update Ring Stats#l";
    cm.sendSimple(options);
}

function action(mode, type, selection) {
    if (mode != 1) {
        cm.dispose();
        return;
    }
    status++;
    if (status == 1) {
        if (selection == 0) {
            if (cm.haveItemWithId(ringId, true)) {
                cm.sendOk("You already have this ring.");
                cm.dispose();
                return;
            }
            if (!cm.canHoldEquip()) {
                cm.sendOk("Please make room in your EQUIP inventory.");
                cm.dispose();
                return;
            }
            giveRing();
        } else if (selection == 1) {
            // CHECK FOR ROOM BEFORE REMOVING
            if (!cm.canHoldEquip()) {
                cm.sendOk("Please make room in your EQUIP inventory.");
                cm.dispose();
                return;
            }
            cm.removeAllRings(ringId);
            giveRing();
        }
    }
}


function giveRing() {
    var cardCount = cm.getPlayer().getMonsterBook().getTotalCards();
    var bonus = cardCount * 2;
    var ring = Packages.server.ItemInformationProvider.getInstance().getEquipById(ringId);
    ring.setJump(bonus);
    ring.setSpeed(bonus);
    cm.gainEquip(ring);
    cm.sendOk("You have received your special ring!\r\n#bJump/Speed: " + bonus);
    cm.dispose();
}
