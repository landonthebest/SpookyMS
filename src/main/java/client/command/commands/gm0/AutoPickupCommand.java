package client.command.commands.gm0;

import client.Client;
import client.command.Command;
import client.Character;
import tools.PacketCreator;

public class AutoPickupCommand extends Command {
    @Override
    public void execute(Client c, String[] args) {
        Character player = c.getPlayer();
        boolean nowEnabled = player.toggleAutoPickupEnabled();

        String message = nowEnabled
                ? "Auto-pickup is ENABLED!"
                : "Auto-pickup is DISABLED!";

        c.sendPacket(PacketCreator.getNPCTalk(9010000, (byte) 0, message, "00 00", (byte) 0));
    }
}