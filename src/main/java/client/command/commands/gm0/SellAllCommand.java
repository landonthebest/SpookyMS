package client.command.commands.gm0;

import java.util.ArrayList;
import java.util.List;

import client.Client;
import client.command.Command;
import client.inventory.Item;
import client.inventory.InventoryType;
import client.inventory.manipulator.InventoryManipulator;
import server.ItemInformationProvider;

public class SellAllCommand extends Command {
    @Override
    public void execute(Client c, String[] args) {
        if (!c.getPlayer().isGM()) {
            c.getPlayer().dropMessage(5, "You do not have permission to use this command.");
            return;
        }

        List<Item> equips = new ArrayList<>(c.getPlayer()
                .getInventory(InventoryType.EQUIP)
                .list());

        int totalMesos = 0;
        for (Item eq : equips) {
            int price = getSellPrice(eq); // Implement or replace with your actual price method
            totalMesos += price * eq.getQuantity(); // Usually quantity=1 for equips, but just in case

            InventoryManipulator.removeFromSlot(
                    c,
                    InventoryType.EQUIP,
                    eq.getPosition(),
                    eq.getQuantity(),
                    true
            );
        }

        if (totalMesos > 0) {
            c.getPlayer().gainMeso(totalMesos, true);
            c.getPlayer().dropMessage(5, "You sold all your equips for " + totalMesos + " mesos!");
        } else {
            c.getPlayer().dropMessage(5, "You had no equips to sell.");
        }
    }

    private int getSellPrice(Item item) {
        // This method should get the NPC sell price for the item.
        // You might have something like item.getPrice() already.
        // If not, look in your Item class or item info provider.
        return ItemInformationProvider.getInstance().getPrice(item.getItemId(), 1);
    }
}