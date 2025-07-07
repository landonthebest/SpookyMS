package client.command.commands.gm0;

import client.Character;
import client.Client;
import client.command.Command;
import scripting.npc.NPCConversationManager; //*
import scripting.npc.NPCScriptManager;  //*
import constants.id.NpcId;

public class ItemEditCommand extends Command{
    {
        setDescription("Edit item droprate & add items");
    }
    private final int npc = NpcId.MAPLE_ADMINISTRATOR;
    public boolean debug = false; //init state,optional


    //optional method
    public boolean setDebug(boolean value){
        return this.debug = value;

    }

    @Override
    public void execute(Client c, String[] params){

        Character player = c.getPlayer();//optional variable

        NPCScriptManager.getInstance().start(c,npc,"itemeditor",null); //itemeditor is js script



    }
}
// SpookyMS