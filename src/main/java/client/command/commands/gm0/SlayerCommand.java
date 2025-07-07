package client.command.commands.gm0;

import client.Client;
import client.command.Command;
import client.Character;
import tools.PacketCreator;

public class SlayerCommand extends Command {
    @Override
    public void execute(Client c, String[] args) {
        Character chr = c.getPlayer();

        int level = chr.getSlayerLevel();
        int exp = chr.getSlayerExp();
        int points = chr.getSlayerPoints();
        int taskMobId = chr.getSlayerTaskMonsterId();
        int taskGoal = chr.getSlayerTaskGoal();
        int taskProgress = chr.getSlayerTaskProgress();

        StringBuilder sb = new StringBuilder();
        sb.append("#e#b[Slayer Status]#k#n\r\n")
                .append("Level: #b").append(level).append("#k (EXP: ").append(exp)
                .append(" / ").append(100 * level).append(")\r\n")
                .append("Points: #r").append(points).append("#k\r\n\r\n");

        if (taskMobId > 0 && taskGoal > 0) {
            String mobName = getMobName(taskMobId);
            sb.append("Current Task: #d").append(mobName)
                    .append("#k (").append(taskProgress).append(" / ").append(taskGoal).append(")");
        } else {
            sb.append("Current Task: #rNone assigned#k.");
        }

        c.sendPacket(PacketCreator.getNPCTalk(9010000, (byte) 0, sb.toString(), "00 00", (byte) 0));
    }

    // Utility: Replace with your actual Mob name lookup
    private String getMobName(int mobId) {
        // If you have a Mob or MonsterInformationProvider, use it here!
        // e.g., return MonsterInformationProvider.getInstance().getName(mobId);
        switch (mobId) {
            case 100100: return "Snail";
            case 100101: return "Blue Snail";
            case 120100: return "Shroom";
            case 130100: return "Stump";
            case 130101: return "Red Snail";
            case 2220000: return "Mano";
            default: return "Monster (" + mobId + ")";
        }
    }

    @Override
    public String getDescription() {
        return "Shows your Slayer Level, Points, and current task progress.";
    }
}
