// AdventureMS - Gachapon

var cashTicket = 5220000;
var petTicket = 5220020;
var chairTicket = 5220010;
var status;

// Open the shop
function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == 1) {
        status++;
    } else {
        status--;
    }
    if (status == -1) {
        cm.dispose();
        return;
    }

    // Conversation Start
    if (status == 0) {
        var NPC = cm.getNpc();

        // Cash Gachapon NPC
        if (NPC === 9100100) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rcash gachapon#k tickets. Would you like to try your luck?");
            } else {
                cm.sendOk("You don't have any #rcash gachapon#k tickets...");
                cm.dispose();
            }
        }

        // Pet Gachapon NPC
        else if (NPC === 9100101) {
            if (cm.haveItem(petTicket)) {
                cm.sendYesNo("You have #rpet gachapon#k tickets. Would you like to try your luck?");
            } else {
                cm.sendOk("You don't have any #rpet gachapon#k tickets...");
                cm.dispose();
            }
        }

        // Chair Gachapon NPC
        else if (NPC === 9100102) {
            if (cm.haveItem(chairTicket)) {
                cm.sendYesNo("You have #rchair gachapon#k tickets. Would you like to try your luck?");
            } else {
                cm.sendOk("You don't have any #rchair gachapon#k tickets...");
                cm.dispose();
            }
        }

        // Eyes Gachapon NPC - uses normal cash ticket
        else if (NPC === 9800036) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for an #bequipable Eye Accessory#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        else if (NPC === 9800038) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a #bCash Cape#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        else if (NPC === 9800039) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a #bCash Glove#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        // Earrings Gachapon NPC - uses normal cash ticket
        else if (NPC === 9800040) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for an #bequipable Earring#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        // Face Gachapon NPC - uses normal cash ticket
        else if (NPC === 9800041) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a #bFace Accessory#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        // Hat Gachapon NPC - uses normal cash ticket
        else if (NPC === 9800042) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a #bHat#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        // dialogue prompt
        else if (NPC === 9800043) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a #bShirt/Coat#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        // dialogue prompt
        else if (NPC === 9800044) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a #bLongcoat#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        else if (NPC === 9800045) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a #bPants#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        else if (NPC === 9800046) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a #bShield#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }
        else if (NPC === 9800047) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a pair of #bShoes#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }


        // Weapons Gachapon NPC - uses normal cash ticket
        else if (NPC === 9800037) {
            if (cm.haveItem(cashTicket)) {
                cm.sendYesNo("You have #rGachapon#k tickets. Would you like to try your luck for a #bCash Weapon#k?");
            } else {
                cm.sendOk("You don't have any #rGachapon#k tickets...");
                cm.dispose();
            }
        }

    }



///////////////////////////////////////////////////////////////////////////////////////////////




    // They want to use a ticket
    else if (status === 1) {
        var NPC = cm.getNpc();

        // Cash Gachapon NPC
        if (NPC === 9100100) {
            if (cm.canHold(1300007)) {
                cm.gainItem(cashTicket, -1);
                cm.doCashGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
        }

else if (NPC === 9800047 && status === 1) {
    if (cm.canHold(1070000)) {
        cm.gainItem(cashTicket, -1);
        cm.doShoesGachapon();
    } else {
        cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
    }
    cm.dispose();
}
        else if (NPC === 9800042) {
            if (cm.canHold(1000000)) { // Example hat item ID
                cm.gainItem(cashTicket, -1);
                cm.doHatGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
        }
        else if (NPC === 9800046 && status === 1) {
            if (cm.canHold(1092031)) {
                cm.gainItem(cashTicket, -1);
                cm.doShieldGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
            cm.dispose();
        }
        else if (NPC === 9800045 && status === 1) {
            if (cm.canHold(1060001)) {
                cm.gainItem(cashTicket, -1);
                cm.doPantsGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
            cm.dispose();
        }
        // after player selects “Yes”
        else if (NPC === 9800044 && status === 1) {
            if (cm.canHold(1050004)) {
                cm.gainItem(cashTicket, -1);
                cm.doLongcoatGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
            cm.dispose();
        }
        // after the player selects “Yes”
        else if (NPC === 9800043 && status === 1) {
            if (cm.canHold(1040001)) {
                cm.gainItem(cashTicket, -1);
                cm.doShirtGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
            cm.dispose();
        }

        else if (NPC === 9800041) {
            if (cm.canHold(1010000)) { // Example face accessory ID
                cm.gainItem(cashTicket, -1);
                cm.doFaceGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
        }

        else if (NPC === 9800039) {
            if (cm.canHold(1080000)) { // Any glove item for the slot
                cm.gainItem(cashTicket, -1);
                cm.doGlovesGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
        }
        else if (NPC === 9800040) {
            if (cm.canHold(1030000)) { // Any earring for slot check
                cm.gainItem(cashTicket, -1);
                cm.doEarringGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
        }




        // Pet Gachapon NPC
        else if (NPC === 9100101) {
            if (cm.canHold(5010000)) {
                cm.gainItem(petTicket, -1);
                cm.doPetGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rCASH#k inventory free.");
            }
        }
        else if (NPC === 9800038) {
            if (cm.canHold(1102005)) { // Any cape item for the slot
                cm.gainItem(cashTicket, -1);
                cm.doCapesGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
        }


        // Chair Gachapon NPC
        else if (NPC === 9100102) {
            if (cm.canHold(3010000)) {
                cm.gainItem(chairTicket, -1);
                cm.doChairGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rSETUP#k inventory free.");
            }
        }
        // Weapon Gachapon NPC
        else if (NPC === 9800037) {
            if (cm.canHold(1702000)) { // Any cash weapon ID
                cm.gainItem(cashTicket, -1);
                cm.doWeaponsGachapon();
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
        }


        // Eyes Gachapon NPC
        else if (NPC === 9800036) {
            // Any valid eye accessory id for inventory check, e.g. 1022000
            if (cm.canHold(1022000)) {
                cm.gainItem(cashTicket, -1);
                cm.doEyesGachapon(); // This must exist in your NPCConversationManager
            } else {
                cm.sendOk("Please have at least one slot in your #rEQUIP#k inventory free.");
            }
        }
        cm.dispose();


    }
}
