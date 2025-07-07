package client.command.commands.gm0;

import client.Client;
import client.command.Command;
import scripting.npc.NPCScriptManager;

public class BlackjackCommand extends Command {
    @Override
    public void execute(Client c, String[] args) {
        // Open dialog with NPC 9010000, which runs the blackjack script
        NPCScriptManager.getInstance().start(c, 9100200, null);
    }
}
