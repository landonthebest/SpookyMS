package client.command.commands.gm0;

import java.util.ArrayList;
import java.util.List;

import client.Client;
import client.command.Command;
import client.inventory.Item;
import client.inventory.Inventory;
import client.inventory.InventoryType;
import client.inventory.manipulator.InventoryManipulator;

public class WipeEquipCommand extends Command {
    @Override
    public void execute(Client c, String[] args) {
        if (!c.getPlayer().isGM()) {
            c.getPlayer().dropMessage(5, "You do not have permission to use this command.");
            return;
        }
        // take a snapshot of all equips
        List<Item> equips = new ArrayList<>(c.getPlayer()
                .getInventory(InventoryType.EQUIP)
                .list());
        for (Item eq : equips) {
            InventoryManipulator.removeFromSlot(
                    c,
                    InventoryType.EQUIP,
                    eq.getPosition(),
                    eq.getQuantity(),
                    true
            );
        }
        c.getPlayer().dropMessage(5, "All items in your Equip tab have been wiped.");
    }


}