/*
This file is part of the OdinMS Maple Story Server
Copyright (C) 2008 Patrick Huy <patrick.huy@frz.cc>
Matthias Butz <matze@odinms.de>
Jan Christian Meyer <vimes@odinms.de>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation version 3 as published by
the Free Software Foundation. You may not use, modify or distribute
this program under any other version of the GNU Affero General Public
License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package scripting.npc;

import client.Character;
import client.*;
import client.inventory.Equip;
import client.inventory.InventoryType;
import client.inventory.Item;
import client.inventory.ItemFactory;
import client.inventory.Pet;
import client.inventory.manipulator.InventoryManipulator;
import config.YamlConfig;
import constants.game.GameConstants;
import constants.id.MapId;
import constants.id.NpcId;
import constants.inventory.ItemConstants;
import constants.string.LanguageConstants;
import net.server.Server;
import net.server.channel.Channel;
import net.server.coordinator.matchchecker.MatchCheckerListenerFactory.MatchCheckerType;
import net.server.guild.Alliance;
import net.server.guild.Guild;
import net.server.guild.GuildPackets;
import net.server.world.Party;
import net.server.world.PartyCharacter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import provider.Data;
import provider.DataProviderFactory;
import provider.wz.WZFiles;
import scripting.AbstractPlayerInteraction;
import server.*;
import server.SkillbookInformationProvider.SkillBookEntry;
import server.events.gm.Event;
import server.expeditions.Expedition;
import server.expeditions.ExpeditionType;
import server.gachapon.Gachapon;
import server.gachapon.Gachapon.GachaponItem;
import server.life.LifeFactory;
import server.life.Monster;
import server.life.MonsterInformationProvider;
import server.life.NPC;
import server.life.PlayerNPC;
import server.maps.MapManager;
import server.maps.MapObject;
import server.maps.MapObjectType;
import server.maps.MapleMap;
import server.partyquest.AriantColiseum;
import server.partyquest.MonsterCarnival;
import server.partyquest.Pyramid;
import server.partyquest.Pyramid.PyramidMode;
import server.slayer.SlayerTaskData;
import tools.DatabaseConnection;
import tools.PacketCreator;
import tools.Pair;
import tools.packets.WeddingPackets;

import java.awt.*;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.*;

import static java.util.concurrent.TimeUnit.MINUTES;

/**
 * @author Matze
 */
public class NPCConversationManager extends AbstractPlayerInteraction {
    private static final Logger log = LoggerFactory.getLogger(NPCConversationManager.class);

    private final int npc;
    private int npcOid;
    private String scriptName;
    private String getText;
    private boolean itemScript;
    private List<PartyCharacter> otherParty;


    private final Map<Integer, String> npcDefaultTalks = new HashMap<>();

    private String getDefaultTalk(int npcid) {
        String talk = npcDefaultTalks.get(npcid);
        if (talk == null) {
            talk = LifeFactory.getNPCDefaultTalk(npcid);
            npcDefaultTalks.put(npcid, talk);
        }
        return talk;
    }

    public NPCConversationManager(Client c, int npc, String scriptName) {
        this(c, npc, -1, scriptName, false);
    }

    public NPCConversationManager(Client c, int npc, List<PartyCharacter> otherParty, boolean test) {
        super(c);
        this.c = c;
        this.npc = npc;
        this.otherParty = otherParty;
    }

    public NPCConversationManager(Client c, int npc, int oid, String scriptName, boolean itemScript) {
        super(c);
        this.npc = npc;
        this.npcOid = oid;
        this.scriptName = scriptName;
        this.itemScript = itemScript;
    }


    public int getNpc() {
        return npc;
    }

    public int getNpcObjectId() {
        return npcOid;
    }

    public String getScriptName() {
        return scriptName;
    }

    public boolean isItemScript() {
        return itemScript;
    }

    public void resetItemScript() {
        this.itemScript = false;
    }

    public void clearDrops() {
        MonsterInformationProvider.getInstance().clearDrops();
    }

    public void dispose() {
        NPCScriptManager.getInstance().dispose(this);
        getClient().sendPacket(PacketCreator.enableActions());
    }

    public void sendNext(String text) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0, text, "00 01", (byte) 0));
    }

    public void sendPrev(String text) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0, text, "01 00", (byte) 0));
    }

    public void sendNextPrev(String text) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0, text, "01 01", (byte) 0));
    }

    public void sendOk(String text) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0, text, "00 00", (byte) 0));
    }

    public void sendDefault() {
        sendOk(getDefaultTalk(npc));
    }

    public void sendYesNo(String text) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 1, text, "", (byte) 0));
    }

    public void sendAcceptDecline(String text) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0x0C, text, "", (byte) 0));
    }

    public void sendSimple(String text) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 4, text, "", (byte) 0));
    }

    public void sendNext(String text, byte speaker) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0, text, "00 01", speaker));
    }

    public void sendPrev(String text, byte speaker) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0, text, "01 00", speaker));
    }

    public void sendNextPrev(String text, byte speaker) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0, text, "01 01", speaker));
    }

    public void sendOk(String text, byte speaker) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0, text, "00 00", speaker));
    }

    public void sendYesNo(String text, byte speaker) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 1, text, "", speaker));
    }

    public void sendAcceptDecline(String text, byte speaker) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 0x0C, text, "", speaker));
    }

    public void sendSimple(String text, byte speaker) {
        getClient().sendPacket(PacketCreator.getNPCTalk(npc, (byte) 4, text, "", speaker));
    }

    public void sendStyle(String text, int[] styles) {
        if (styles.length > 0) {
            getClient().sendPacket(PacketCreator.getNPCTalkStyle(npc, text, styles));
        } else {    // thanks Conrad for noticing empty styles crashing players
            sendOk("Sorry, there are no options of cosmetics available for you here at the moment.");
            dispose();
        }
    }

    public void sendGetNumber(String text, int def, int min, int max) {
        getClient().sendPacket(PacketCreator.getNPCTalkNum(npc, text, def, min, max));
    }

    public void sendGetText(String text) {
        getClient().sendPacket(PacketCreator.getNPCTalkText(npc, text, ""));
    }

    public void sendDimensionalMirror(String text) {
        getClient().sendPacket(PacketCreator.getDimensionalMirror(text));
    }

    public void setGetText(String text) {
        this.getText = text;
    }

    public String getText() {
        return this.getText;
    }

    @Override
    public boolean forceStartQuest(int id) {
        return forceStartQuest(id, npc);
    }

    @Override
    public boolean forceCompleteQuest(int id) {
        return forceCompleteQuest(id, npc);
    }

    @Override
    public boolean startQuest(short id) {
        return startQuest((int) id);
    }

    @Override
    public boolean completeQuest(short id) {
        return completeQuest((int) id);
    }

    @Override
    public boolean startQuest(int id) {
        return startQuest(id, npc);
    }

    @Override
    public boolean completeQuest(int id) {
        return completeQuest(id, npc);
    }

    public int getMeso() {
        return getPlayer().getMeso();
    }

    public void gainMeso(int gain) {
        getPlayer().gainMeso(gain);
    }

    public void gainMeso(Double gain) {
        getPlayer().gainMeso(gain.intValue());
    }

    public void gainExp(int gain) {
        getPlayer().gainExp(gain, true, true);
    }

    public int getZoneProgress() {return getPlayer().getZoneProgress();} // AdventureMS Specific

    @Override
    public void showEffect(String effect) {
        getPlayer().getMap().broadcastMessage(PacketCreator.environmentChange(effect, 3));
    }

    public void setHair(int hair) {
        getPlayer().setHair(hair);
        getPlayer().updateSingleStat(Stat.HAIR, hair);
        getPlayer().equipChanged();
    }

    public void setFace(int face) {
        getPlayer().setFace(face);
        getPlayer().updateSingleStat(Stat.FACE, face);
        getPlayer().equipChanged();
    }

    public void setSkin(int color) {
        getPlayer().setSkinColor(SkinColor.getById(color));
        getPlayer().updateSingleStat(Stat.SKIN, color);
        getPlayer().equipChanged();
    }

    public int itemQuantity(int itemid) {
        return getPlayer().getInventory(ItemConstants.getInventoryType(itemid)).countById(itemid);
    }

    public void displayGuildRanks() {
        Guild.displayGuildRanks(getClient(), npc);
    }

    public boolean canSpawnPlayerNpc(int mapid) {
        Character chr = getPlayer();
        return !YamlConfig.config.server.PLAYERNPC_AUTODEPLOY && chr.getLevel() >= chr.getMaxClassLevel() && !chr.isGM() && PlayerNPC.canSpawnPlayerNpc(chr.getName(), mapid);
    }

    public PlayerNPC getPlayerNPCByScriptid(int scriptId) {
        for (MapObject pnpcObj : getPlayer().getMap().getMapObjectsInRange(new Point(0, 0), Double.POSITIVE_INFINITY, Arrays.asList(MapObjectType.PLAYER_NPC))) {
            PlayerNPC pn = (PlayerNPC) pnpcObj;

            if (pn.getScriptId() == scriptId) {
                return pn;
            }
        }

        return null;
    }

    @Override
    public Party getParty() {
        return getPlayer().getParty();
    }

    @Override
    public void resetMap(int mapid) {
        getClient().getChannelServer().getMapFactory().getMap(mapid).resetReactors();
    }

    public void gainTameness(int tameness) {
        for (Pet pet : getPlayer().getPets()) {
            if (pet != null) {
                pet.gainTamenessFullness(getPlayer(), tameness, 0, 0);
            }
        }
    }

    public String getName() {
        return getPlayer().getName();
    }

    public int getGender() {
        return getPlayer().getGender();
    }

    public void changeJobById(int a) {
        getPlayer().changeJob(Job.getById(a));
    }

    public void changeJob(Job job) {
        getPlayer().changeJob(job);
    }

    public String getJobName(int id) {
        return GameConstants.getJobName(id);
    }

    public StatEffect getItemEffect(int itemId) {
        return ItemInformationProvider.getInstance().getItemEffect(itemId);
    }

    public void resetStats() {
        getPlayer().resetStats();
    }

    public void openShopNPC(int id) {
        Shop shop = ShopFactory.getInstance().getShop(id);

        if (shop != null) {
            shop.sendShop(c);
        } else {    // check for missing shopids thanks to resinate
            log.warn("Shop ID: {} is missing from database.", id);
            ShopFactory.getInstance().getShop(11000).sendShop(c);
        }
    }

    public void maxMastery() {
        for (Data skill_ : DataProviderFactory.getDataProvider(WZFiles.STRING).getData("Skill.img").getChildren()) {
            try {
                Skill skill = SkillFactory.getSkill(Integer.parseInt(skill_.getName()));
                getPlayer().changeSkillLevel(skill, (byte) 0, skill.getMaxLevel(), -1);
            } catch (NumberFormatException nfe) {
                nfe.printStackTrace();
                break;
            } catch (NullPointerException npe) {
                npe.printStackTrace();
                continue;
            }
        }
    }

    // AdventureMS Custom
    public void doCashGachapon()
    {
        GachaponItem item = Gachapon.getInstance().process(npc);

        // Gain Cash Item
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);

        sendOk("You received the following item:\r\n\r\n#v" + item.getId() + "# #b#t" + item.getId() + "##k");

        String map = "Cash";

        // Log to Console
        // Gachapon.log(getPlayer(), item.getId(), map);

        // Rare Only
        if (item.getTier() > 1)
        {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }

        // Send the ID for debugging
        getPlayer().yellowMessage("Cash Gachapon ID (report bad items in Discord!): " + item.getId());
    }

    //Landon Custom eyes gachapon
    public void doEyesGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);

        // Give the item
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);

        // Message
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");

        // For logging/broadcast (optional, you can choose a string for 'map')
        String map = "Eyes";

        // Log to Console
        Gachapon.log(getPlayer(), item.getId(), map);

        // Rare Only - Send Server Message
        if (item.getTier() > 2)
        {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }
    public void doCapesGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);

        sendOk("You have obtained a #b#t" + item.getId() + "##k.");

        String map = "Capes";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }
    public void doEarringGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");
        String map = "Earrings";
        Gachapon.log(getPlayer(), item.getId(), map);
        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }
    public void doHatGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");
        String map = "Hat";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }
    public void doLongcoatGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short)1, false, true);
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");
        String map = "Longcoat";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(getClient().getWorld(),
                    PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }
    public void doShoesGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");
        String map = "Shoes";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(getClient().getWorld(),
                    PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }
    public void doShieldGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short)1, false, true);
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");
        String map = "Shield";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(getClient().getWorld(),
                    PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }
    public void doPantsGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short)1, false, true);
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");
        String map = "Pants";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(getClient().getWorld(),
                    PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }

    public void doShirtGachapon() {
        // roll
        GachaponItem item = Gachapon.getInstance().process(npc);
        // give to player
        Item itemGained = gainItem(item.getId(), (short)1, false, true);
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");
        // log & maybe broadcast
        String map = "Shirt";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance()
                    .broadcastMessage(
                            getClient().getWorld(),
                            PacketCreator.gachaponMessage(itemGained, map, getPlayer())
                    );
        }
    }

    public void doFaceGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");
        String map = "Face";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }


    public void doGlovesGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);

        sendOk("You have obtained a #b#t" + item.getId() + "##k.");

        String map = "Gloves";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }
    public void doWeaponsGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);

        sendOk("You have obtained a #b#t" + item.getId() + "##k.");

        String map = "Weapons";
        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 2) {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }

    // AdventureMS Custom
    public void doPetGachapon()
    {

        // Find a gacha item
        GachaponItem item = Gachapon.getInstance().process(npc);

        // Gain Cash Item
        Item itemGained = gainItem(item.getId(), (short) 1, false, true, 7776000000L);

        // Send NPC Message Window
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");

        // Assign map for server message
        String map = "Pet";

        // Log to Console
        Gachapon.log(getPlayer(), item.getId(), map);

        //Rare Only - Send Server Message
        if (item.getTier() > 2)
        {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }

    // AdventureMS Custom
    public void doChairGachapon()
    {
        // Find a gacha item
        GachaponItem item = Gachapon.getInstance().process(npc);

        // Gain Cash Item
        Item itemGained = gainItem(item.getId(), (short) 1, false, true);

        // Send NPC Message Window
        sendOk("You have obtained a #b#t" + item.getId() + "##k.");

        // Assign map for server message
        String map = "Chair";

        // Log to Console
        Gachapon.log(getPlayer(), item.getId(), map);

        //Rare Only - Send Server Message
        if (item.getTier() > 2)
        {
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }

    public void doGachapon() {
        GachaponItem item = Gachapon.getInstance().process(npc);
        Item itemGained = gainItem(item.getId(), (short) (item.getId() / 10000 == 200 ? 100 : 1), true, true); // For normal potions, make it give 100.

        sendNext("You have obtained a #b#t" + item.getId() + "##k.");

        int[] maps = {MapId.HENESYS, MapId.ELLINIA, MapId.PERION, MapId.KERNING_CITY, MapId.SLEEPYWOOD, MapId.MUSHROOM_SHRINE,
                MapId.SHOWA_SPA_M, MapId.SHOWA_SPA_F, MapId.NEW_LEAF_CITY, MapId.NAUTILUS_HARBOR};
        final int mapId = maps[(getNpc() != NpcId.GACHAPON_NAUTILUS && getNpc() != NpcId.GACHAPON_NLC) ?
                (getNpc() - NpcId.GACHAPON_HENESYS) : getNpc() == NpcId.GACHAPON_NLC ? 8 : 9];
        String map = c.getChannelServer().getMapFactory().getMap(mapId).getMapName();

        Gachapon.log(getPlayer(), item.getId(), map);

        if (item.getTier() > 0) { //Uncommon and Rare
            Server.getInstance().broadcastMessage(c.getWorld(), PacketCreator.gachaponMessage(itemGained, map, getPlayer()));
        }
    }

    public void upgradeAlliance() {
        Alliance alliance = Server.getInstance().getAlliance(c.getPlayer().getGuild().getAllianceId());
        alliance.increaseCapacity(1);

        Server.getInstance().allianceMessage(alliance.getId(), GuildPackets.getGuildAlliances(alliance, c.getWorld()), -1, -1);
        Server.getInstance().allianceMessage(alliance.getId(), GuildPackets.allianceNotice(alliance.getId(), alliance.getNotice()), -1, -1);

        c.sendPacket(GuildPackets.updateAllianceInfo(alliance, c.getWorld()));  // thanks Vcoc for finding an alliance update to leader issue
    }

    public void disbandAlliance(Client c, int allianceId) {
        Alliance.disbandAlliance(allianceId);
    }

    public boolean canBeUsedAllianceName(String name) {
        return Alliance.canBeUsedAllianceName(name);
    }

    public Alliance createAlliance(String name) {
        return Alliance.createAlliance(getParty(), name);
    }

    public int getAllianceCapacity() {
        return Server.getInstance().getAlliance(getPlayer().getGuild().getAllianceId()).getCapacity();
    }

    public boolean hasMerchant() {
        return getPlayer().hasMerchant();
    }

    public boolean hasMerchantItems() {
        try {
            if (!ItemFactory.MERCHANT.loadItems(getPlayer().getId(), false).isEmpty()) {
                return true;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
        return getPlayer().getMerchantMeso() != 0;
    }

    public void showFredrick() {
        c.sendPacket(PacketCreator.getFredrick(getPlayer()));
    }

    public int partyMembersInMap() {
        int inMap = 0;
        for (Character char2 : getPlayer().getMap().getCharacters()) {
            if (char2.getParty() == getPlayer().getParty()) {
                inMap++;
            }
        }
        return inMap;
    }

    public Event getEvent() {
        return c.getChannelServer().getEvent();
    }

    public void divideTeams() {
        if (getEvent() != null) {
            getPlayer().setTeam(getEvent().getLimit() % 2); //muhaha :D
        }
    }

    public Character getMapleCharacter(String player) {
        Character target = Server.getInstance().getWorld(c.getWorld()).getChannel(c.getChannel()).getPlayerStorage().getCharacterByName(player);
        return target;
    }

    public void logLeaf(String prize) {
        MapleLeafLogger.log(getPlayer(), true, prize);
    }

    public boolean createPyramid(String mode, boolean party) {//lol
        PyramidMode mod = PyramidMode.valueOf(mode);

        Party partyz = getPlayer().getParty();
        MapManager mapManager = c.getChannelServer().getMapFactory();

        MapleMap map = null;
        int mapid = MapId.NETTS_PYRAMID_SOLO_BASE;
        if (party) {
            mapid += 10000;
        }
        mapid += (mod.getMode() * 1000);

        for (byte b = 0; b < 5; b++) {//They cannot warp to the next map before the timer ends (:
            map = mapManager.getMap(mapid + b);
            if (map.getCharacters().size() > 0) {
                continue;
            } else {
                break;
            }
        }

        if (map == null) {
            return false;
        }

        if (!party) {
            partyz = new Party(-1, new PartyCharacter(getPlayer()));
        }
        Pyramid py = new Pyramid(partyz, mod, map.getId());
        getPlayer().setPartyQuest(py);
        py.warp(mapid);
        dispose();
        return true;
    }

    public boolean itemExists(int itemid) {
        return ItemInformationProvider.getInstance().getName(itemid) != null;
    }

    public int getCosmeticItem(int itemid) {
        if (itemExists(itemid)) {
            return itemid;
        }

        int baseid;
        if (itemid < 30000) {
            baseid = (itemid / 1000) * 1000 + (itemid % 100);
        } else {
            baseid = (itemid / 10) * 10;
        }

        return itemid != baseid && itemExists(baseid) ? baseid : -1;
    }

    private int getEquippedCosmeticid(int itemid) {
        if (itemid < 30000) {
            return getPlayer().getFace();
        } else {
            return getPlayer().getHair();
        }
    }

    public boolean isCosmeticEquipped(int itemid) {
        return getEquippedCosmeticid(itemid) == itemid;
    }

    public boolean isUsingOldPqNpcStyle() {
        return YamlConfig.config.server.USE_OLD_GMS_STYLED_PQ_NPCS && this.getPlayer().getParty() != null;
    }

    public Object[] getAvailableMasteryBooks() {
        return ItemInformationProvider.getInstance().usableMasteryBooks(this.getPlayer()).toArray();
    }

    public Object[] getAvailableSkillBooks() {
        List<Integer> ret = ItemInformationProvider.getInstance().usableSkillBooks(this.getPlayer());
        ret.addAll(SkillbookInformationProvider.getTeachableSkills(this.getPlayer()));

        return ret.toArray();
    }

    public Object[] getNamesWhoDropsItem(Integer itemId) {
        return ItemInformationProvider.getInstance().getWhoDrops(itemId).toArray();
    }

    public String getSkillBookInfo(int itemid) {
        SkillBookEntry sbe = SkillbookInformationProvider.getSkillbookAvailability(itemid);
        switch (sbe) {
            case UNAVAILABLE:
                return "";

            case REACTOR:
                return "    Obtainable through #rexploring#k (loot boxes).";

            case SCRIPT:
                return "    Obtainable through #rexploring#k (field interaction).";

            case QUEST_BOOK:
                return "    Obtainable through #rquestline#k (collecting book).";

            case QUEST_REWARD:
                return "    Obtainable through #rquestline#k (quest reward).";

            default:
                return "    Obtainable through #rquestline#k.";
        }
    }

    // (CPQ + WED wishlist) by -- Drago (Dragohe4rt)
    public int cpqCalcAvgLvl(int map) {
        int num = 0;
        int avg = 0;
        for (MapObject mmo : c.getChannelServer().getMapFactory().getMap(map).getAllPlayer()) {
            avg += ((Character) mmo).getLevel();
            num++;
        }
        avg /= num;
        return avg;
    }

    public boolean sendCPQMapLists() {
        String msg = LanguageConstants.getMessage(getPlayer(), LanguageConstants.CPQPickRoom);
        int msgLen = msg.length();
        for (int i = 0; i < 6; i++) {
            if (fieldTaken(i)) {
                if (fieldLobbied(i)) {
                    msg += "#b#L" + i + "#Carnival Field " + (i + 1) + " (Level: "  // "Carnival field" GMS-like improvement thanks to Jayd (jaydenseah)
                            + cpqCalcAvgLvl(980000100 + i * 100) + " / "
                            + getPlayerCount(980000100 + i * 100) + "x"
                            + getPlayerCount(980000100 + i * 100) + ")  #l\r\n";
                }
            } else {
                if (i >= 0 && i <= 3) {
                    msg += "#b#L" + i + "#Carnival Field " + (i + 1) + " (2x2) #l\r\n";
                } else {
                    msg += "#b#L" + i + "#Carnival Field " + (i + 1) + " (3x3) #l\r\n";
                }
            }
        }

        if (msg.length() > msgLen) {
            sendSimple(msg);
            return true;
        } else {
            return false;
        }
    }

    public boolean fieldTaken(int field) {
        if (!c.getChannelServer().canInitMonsterCarnival(true, field)) {
            return true;
        }
        if (!c.getChannelServer().getMapFactory().getMap(980000100 + field * 100).getAllPlayer().isEmpty()) {
            return true;
        }
        if (!c.getChannelServer().getMapFactory().getMap(980000101 + field * 100).getAllPlayer().isEmpty()) {
            return true;
        }
        return !c.getChannelServer().getMapFactory().getMap(980000102 + field * 100).getAllPlayer().isEmpty();
    }

    public boolean fieldLobbied(int field) {
        return !c.getChannelServer().getMapFactory().getMap(980000100 + field * 100).getAllPlayer().isEmpty();
    }

    public void cpqLobby(int field) {
        try {
            final MapleMap map, mapExit;
            Channel cs = c.getChannelServer();

            map = cs.getMapFactory().getMap(980000100 + 100 * field);
            mapExit = cs.getMapFactory().getMap(980000000);
            for (PartyCharacter mpc : c.getPlayer().getParty().getMembers()) {
                final Character mc = mpc.getPlayer();
                if (mc != null) {
                    mc.setChallenged(false);
                    mc.changeMap(map, map.getPortal(0));
                    mc.sendPacket(PacketCreator.serverNotice(6, LanguageConstants.getMessage(mc, LanguageConstants.CPQEntryLobby)));
                    TimerManager tMan = TimerManager.getInstance();
                    tMan.schedule(() -> mapClock((int) MINUTES.toSeconds(3)), 1500);

                    mc.setCpqTimer(TimerManager.getInstance().schedule(() -> mc.changeMap(mapExit, mapExit.getPortal(0)), MINUTES.toMillis(3)));
                }
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    public Character getChrById(int id) {
        return c.getChannelServer().getPlayerStorage().getCharacterById(id);
    }

    public void cancelCPQLobby() {
        for (PartyCharacter mpc : c.getPlayer().getParty().getMembers()) {
            Character mc = mpc.getPlayer();
            if (mc != null) {
                mc.clearCpqTimer();
            }
        }
    }

    private void warpoutCPQLobby(MapleMap lobbyMap) {
        MapleMap out = lobbyMap.getChannelServer().getMapFactory().getMap((lobbyMap.getId() < 980030000) ? 980000000 : 980030000);
        for (Character mc : lobbyMap.getAllPlayers()) {
            mc.resetCP();
            mc.setTeam(-1);
            mc.setMonsterCarnival(null);
            mc.changeMap(out, out.getPortal(0));
        }
    }

    private int isCPQParty(MapleMap lobby, Party party) {
        int cpqMinLvl, cpqMaxLvl;

        if (lobby.isCPQLobby()) {
            cpqMinLvl = 30;
            cpqMaxLvl = 50;
        } else {
            cpqMinLvl = 51;
            cpqMaxLvl = 70;
        }

        List<PartyCharacter> partyMembers = party.getPartyMembers();
        for (PartyCharacter pchr : partyMembers) {
            if (pchr.getLevel() >= cpqMinLvl && pchr.getLevel() <= cpqMaxLvl) {
                if (lobby.getCharacterById(pchr.getId()) == null) {
                    return 1;  // party member detected out of area
                }
            } else {
                return 2;  // party member doesn't fit requirements
            }
        }

        return 0;
    }

    private int canStartCPQ(MapleMap lobby, Party party, Party challenger) {
        int ret = isCPQParty(lobby, party);
        if (ret != 0) {
            return ret;
        }

        ret = isCPQParty(lobby, challenger);
        if (ret != 0) {
            return -ret;
        }

        return 0;
    }

    public void startCPQ(final Character challenger, final int field) {
        try {
            cancelCPQLobby();

            final MapleMap lobbyMap = getPlayer().getMap();
            if (challenger != null) {
                if (challenger.getParty() == null) {
                    throw new RuntimeException("No opponent found!");
                }

                for (PartyCharacter mpc : challenger.getParty().getMembers()) {
                    Character mc = mpc.getPlayer();
                    if (mc != null) {
                        mc.changeMap(lobbyMap, lobbyMap.getPortal(0));
                        TimerManager tMan = TimerManager.getInstance();
                        tMan.schedule(() -> mapClock(10), 1500);
                    }
                }
                for (PartyCharacter mpc : getPlayer().getParty().getMembers()) {
                    Character mc = mpc.getPlayer();
                    if (mc != null) {
                        TimerManager tMan = TimerManager.getInstance();
                        tMan.schedule(() -> mapClock(10), 1500);
                    }
                }
            }
            final int mapid = c.getPlayer().getMapId() + 1;
            TimerManager tMan = TimerManager.getInstance();
            tMan.schedule(() -> {
                try {
                    for (PartyCharacter mpc : getPlayer().getParty().getMembers()) {
                        Character mc = mpc.getPlayer();
                        if (mc != null) {
                            mc.setMonsterCarnival(null);
                        }
                    }
                    for (PartyCharacter mpc : challenger.getParty().getMembers()) {
                        Character mc = mpc.getPlayer();
                        if (mc != null) {
                            mc.setMonsterCarnival(null);
                        }
                    }
                } catch (NullPointerException npe) {
                    warpoutCPQLobby(lobbyMap);
                    return;
                }

                Party lobbyParty = getPlayer().getParty(), challengerParty = challenger.getParty();
                int status = canStartCPQ(lobbyMap, lobbyParty, challengerParty);
                if (status == 0) {
                    new MonsterCarnival(lobbyParty, challengerParty, mapid, true, (field / 100) % 10);
                } else {
                    warpoutCPQLobby(lobbyMap);
                }
            }, 11000);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void startCPQ2(final Character challenger, final int field) {
        try {
            cancelCPQLobby();

            final MapleMap lobbyMap = getPlayer().getMap();
            if (challenger != null) {
                if (challenger.getParty() == null) {
                    throw new RuntimeException("No opponent found!");
                }

                for (PartyCharacter mpc : challenger.getParty().getMembers()) {
                    Character mc = mpc.getPlayer();
                    if (mc != null) {
                        mc.changeMap(lobbyMap, lobbyMap.getPortal(0));
                        mapClock(10);
                    }
                }
            }
            final int mapid = c.getPlayer().getMapId() + 100;
            TimerManager tMan = TimerManager.getInstance();
            tMan.schedule(() -> {
                try {
                    for (PartyCharacter mpc : getPlayer().getParty().getMembers()) {
                        Character mc = mpc.getPlayer();
                        if (mc != null) {
                            mc.setMonsterCarnival(null);
                        }
                    }
                    for (PartyCharacter mpc : challenger.getParty().getMembers()) {
                        Character mc = mpc.getPlayer();
                        if (mc != null) {
                            mc.setMonsterCarnival(null);
                        }
                    }
                } catch (NullPointerException npe) {
                    warpoutCPQLobby(lobbyMap);
                    return;
                }

                Party lobbyParty = getPlayer().getParty(), challengerParty = challenger.getParty();
                int status = canStartCPQ(lobbyMap, lobbyParty, challengerParty);
                if (status == 0) {
                    new MonsterCarnival(lobbyParty, challengerParty, mapid, false, (field / 1000) % 10);
                } else {
                    warpoutCPQLobby(lobbyMap);
                }
            }, 10000);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public boolean sendCPQMapLists2() {
        String msg = LanguageConstants.getMessage(getPlayer(), LanguageConstants.CPQPickRoom);
        int msgLen = msg.length();
        for (int i = 0; i < 3; i++) {
            if (fieldTaken2(i)) {
                if (fieldLobbied2(i)) {
                    msg += "#b#L" + i + "#Carnival Field " + (i + 1) + " (Level: "  // "Carnival field" GMS-like improvement thanks to Jayd
                            + cpqCalcAvgLvl(980031000 + i * 1000) + " / "
                            + getPlayerCount(980031000 + i * 1000) + "x"
                            + getPlayerCount(980031000 + i * 1000) + ")  #l\r\n";
                }
            } else {
                if (i == 0 || i == 1) {
                    msg += "#b#L" + i + "#Carnival Field " + (i + 1) + " (2x2) #l\r\n";
                } else {
                    msg += "#b#L" + i + "#Carnival Field " + (i + 1) + " (3x3) #l\r\n";
                }
            }
        }

        if (msg.length() > msgLen) {
            sendSimple(msg);
            return true;
        } else {
            return false;
        }
    }

    public boolean fieldTaken2(int field) {
        if (!c.getChannelServer().canInitMonsterCarnival(false, field)) {
            return true;
        }
        if (!c.getChannelServer().getMapFactory().getMap(980031000 + field * 1000).getAllPlayer().isEmpty()) {
            return true;
        }
        if (!c.getChannelServer().getMapFactory().getMap(980031100 + field * 1000).getAllPlayer().isEmpty()) {
            return true;
        }
        return !c.getChannelServer().getMapFactory().getMap(980031200 + field * 1000).getAllPlayer().isEmpty();
    }

    public boolean fieldLobbied2(int field) {
        return !c.getChannelServer().getMapFactory().getMap(980031000 + field * 1000).getAllPlayer().isEmpty();
    }

    public void cpqLobby2(int field) {
        try {
            final MapleMap map, mapExit;
            Channel cs = c.getChannelServer();

            mapExit = cs.getMapFactory().getMap(980030000);
            map = cs.getMapFactory().getMap(980031000 + 1000 * field);
            for (PartyCharacter mpc : c.getPlayer().getParty().getMembers()) {
                final Character mc = mpc.getPlayer();
                if (mc != null) {
                    mc.setChallenged(false);
                    mc.changeMap(map, map.getPortal(0));
                    mc.sendPacket(PacketCreator.serverNotice(6, LanguageConstants.getMessage(mc, LanguageConstants.CPQEntryLobby)));
                    TimerManager tMan = TimerManager.getInstance();
                    tMan.schedule(() -> mapClock((int) MINUTES.toSeconds(3)), 1500);

                    mc.setCpqTimer(TimerManager.getInstance().schedule(() -> mc.changeMap(mapExit, mapExit.getPortal(0)), MINUTES.toMillis(3)));
                }
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    public void mapClock(int time) {
        getPlayer().getMap().broadcastMessage(PacketCreator.getClock(time));
    }

    private boolean sendCPQChallenge(String cpqType, int leaderid) {
        Set<Integer> cpqLeaders = new HashSet<>();
        cpqLeaders.add(leaderid);
        cpqLeaders.add(getPlayer().getId());

        return c.getWorldServer().getMatchCheckerCoordinator().createMatchConfirmation(MatchCheckerType.CPQ_CHALLENGE, c.getWorld(), getPlayer().getId(), cpqLeaders, cpqType);
    }

    public void answerCPQChallenge(boolean accept) {
        c.getWorldServer().getMatchCheckerCoordinator().answerMatchConfirmation(getPlayer().getId(), accept);
    }

    public void challengeParty2(int field) {
        Character leader = null;
        MapleMap map = c.getChannelServer().getMapFactory().getMap(980031000 + 1000 * field);
        for (MapObject mmo : map.getAllPlayer()) {
            Character mc = (Character) mmo;
            if (mc.getParty() == null) {
                sendOk(LanguageConstants.getMessage(mc, LanguageConstants.CPQFindError));
                return;
            }
            if (mc.getParty().getLeader().getId() == mc.getId()) {
                leader = mc;
                break;
            }
        }
        if (leader != null) {
            if (!leader.isChallenged()) {
                if (!sendCPQChallenge("cpq2", leader.getId())) {
                    sendOk(LanguageConstants.getMessage(leader, LanguageConstants.CPQChallengeRoomAnswer));
                }
            } else {
                sendOk(LanguageConstants.getMessage(leader, LanguageConstants.CPQChallengeRoomAnswer));
            }
        } else {
            sendOk(LanguageConstants.getMessage(leader, LanguageConstants.CPQLeaderNotFound));
        }
    }

    public void challengeParty(int field) {
        Character leader = null;
        MapleMap map = c.getChannelServer().getMapFactory().getMap(980000100 + 100 * field);
        if (map.getAllPlayer().size() != getPlayer().getParty().getMembers().size()) {
            sendOk("An unexpected error regarding the other party has occurred.");
            return;
        }
        for (MapObject mmo : map.getAllPlayer()) {
            Character mc = (Character) mmo;
            if (mc.getParty() == null) {
                sendOk(LanguageConstants.getMessage(mc, LanguageConstants.CPQFindError));
                return;
            }
            if (mc.getParty().getLeader().getId() == mc.getId()) {
                leader = mc;
                break;
            }
        }
        if (leader != null) {
            if (!leader.isChallenged()) {
                if (!sendCPQChallenge("cpq1", leader.getId())) {
                    sendOk(LanguageConstants.getMessage(leader, LanguageConstants.CPQChallengeRoomAnswer));
                }
            } else {
                sendOk(LanguageConstants.getMessage(leader, LanguageConstants.CPQChallengeRoomAnswer));
            }
        } else {
            sendOk(LanguageConstants.getMessage(leader, LanguageConstants.CPQLeaderNotFound));
        }
    }

    private synchronized boolean setupAriantBattle(Expedition exped, int mapid) {
        MapleMap arenaMap = this.getMap().getChannelServer().getMapFactory().getMap(mapid + 1);
        if (!arenaMap.getAllPlayers().isEmpty()) {
            return false;
        }

        new AriantColiseum(arenaMap, exped);
        return true;
    }

    public String startAriantBattle(ExpeditionType expedType, int mapid) {
        if (!GameConstants.isAriantColiseumLobby(mapid)) {
            return "You cannot start an Ariant tournament from outside the Battle Arena Entrance.";
        }

        Expedition exped = this.getMap().getChannelServer().getExpedition(expedType);
        if (exped == null) {
            return "Please register on an expedition before attempting to start an Ariant tournament.";
        }

        List<Character> players = exped.getActiveMembers();

        int playersSize = players.size();
        if (!(playersSize >= exped.getMinSize() && playersSize <= exped.getMaxSize())) {
            return "Make sure there are between #r" + exped.getMinSize() + " ~ " + exped.getMaxSize() + " players#k in this room to start the battle.";
        }

        MapleMap leaderMap = this.getMap();
        for (Character mc : players) {
            if (mc.getMap() != leaderMap) {
                return "All competing players should be on this area to start the battle.";
            }

            if (mc.getParty() != null) {
                return "All competing players must not be on a party to start the battle.";
            }

            int level = mc.getLevel();
            if (!(level >= expedType.getMinLevel() && level <= expedType.getMaxLevel())) {
                return "There are competing players outside of the acceptable level range in this room. All players must be on #blevel between 20~30#k to start the battle.";
            }
        }

        if (setupAriantBattle(exped, mapid)) {
            return "";
        } else {
            return "Other players are already competing on the Ariant tournament in this room. Please wait a while until the arena becomes available again.";
        }
    }

    public void sendMarriageWishlist(boolean groom) {
        Character player = this.getPlayer();
        Marriage marriage = player.getMarriageInstance();
        if (marriage != null) {
            int cid = marriage.getIntProperty(groom ? "groomId" : "brideId");
            Character chr = marriage.getPlayerById(cid);
            if (chr != null) {
                if (chr.getId() == player.getId()) {
                    player.sendPacket(WeddingPackets.onWeddingGiftResult((byte) 0xA, marriage.getWishlistItems(groom), marriage.getGiftItems(player.getClient(), groom)));
                } else {
                    marriage.setIntProperty("wishlistSelection", groom ? 0 : 1);
                    player.sendPacket(WeddingPackets.onWeddingGiftResult((byte) 0x09, marriage.getWishlistItems(groom), marriage.getGiftItems(player.getClient(), groom)));
                }
            }
        }
    }

    public void sendMarriageGifts(List<Item> gifts) {
        this.getPlayer().sendPacket(WeddingPackets.onWeddingGiftResult((byte) 0xA, Collections.singletonList(""), gifts));
    }

    public boolean createMarriageWishlist() {
        Marriage marriage = this.getPlayer().getMarriageInstance();
        if (marriage != null) {
            Boolean groom = marriage.isMarriageGroom(this.getPlayer());
            if (groom != null) {
                String wlKey;
                if (groom) {
                    wlKey = "groomWishlist";
                } else {
                    wlKey = "brideWishlist";
                }

                if (marriage.getProperty(wlKey).contentEquals("")) {
                    getClient().sendPacket(WeddingPackets.sendWishList());
                    return true;
                }
            }
        }

        return false;
    }
    /** cm.letters("Hello world"); will show Christmas letters Hello world
     *
     * @param input the text to turn into christmas :)
     * @return String with item images
     */
    public String letters(String input) {
        //input = input.toLowerCase();
        StringBuilder str = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            if (input.charAt(i) == ' ') {
                str.append("\t");
            } else {
                str.append("#i").append(convert(input.charAt(i))).append("#");
            }
        }
        return str.toString();
    }
    private int convert(char in) {
        int upper = 3991000;
        int lower = 3991026;
        int output = java.lang.Character.isUpperCase(in) ? upper : lower; //fix package conflict
        output += java.lang.Character.toLowerCase(in) - 97;
        return output;
    }
    public void logToConsole(String message) {
        System.out.println(message);
    }


    /**
     * DO NOT TOUCH IF YOU DONT KNOW WHAT IT IS
     *
     * @param query
     * @param return_item
     * @return ANYTHING from the database
     */
    public ArrayList masterQueryRaw(String query, String return_item) {
        ArrayList<Object> queryObjects = new ArrayList<>();
        try (Connection con = DatabaseConnection.getConnection()) {
            try (PreparedStatement ps = con.prepareStatement(query); ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    queryObjects.add(rs.getObject(return_item));
                }
            }
        } catch (SQLException sqle) {
            sqle.printStackTrace();
        }
        if (queryObjects.isEmpty()) {
            queryObjects.add("The query:\r\n#e" + query + "#n\r\nDid not give any result.");
            return queryObjects;
        }
        return queryObjects;
    }
    public boolean masterQueryUpdate(String query) {
        try (Connection con = DatabaseConnection.getConnection()) {
            try (PreparedStatement ps = con.prepareStatement(query)) {
                ps.executeUpdate();
            }
            return true;
        } catch (SQLException sqle) {
            sqle.printStackTrace();
        }
        return false;
    }
    public boolean masterQueryInsert(String query) {
        try (Connection con = DatabaseConnection.getConnection()) {
            try (PreparedStatement ps = con.prepareStatement(query)) {
                ps.addBatch();
                ps.executeBatch();
            }
            return true;
        } catch (SQLException sqle) {
            sqle.printStackTrace();
        }
        return false;
    }
    public void summonMob(int mobid) {
        Monster mob = LifeFactory.getMonster(mobid);
        getPlayer().getMap().spawnMonsterOnGroundBelow(mob, getPlayer().getPosition());
    }

    public void makeNpc(int npcid, int x, int y) { // npception ecksdee
        Point p = new Point(x, y);
        NPC npc = LifeFactory.getNPC(npcid);
        npc.setPosition(p);
        npc.setCy(p.y);
        npc.setRx0(p.x + 50);
        npc.setRx1(p.x - 50);
        npc.setFh(getPlayer().getMap().getFootholds().findBelow(p).getId());
        getPlayer().getMap().addMapObject(npc);
        getPlayer().getMap().broadcastMessage(PacketCreator.spawnNPC(npc));
    }
    public List<Map<String, Object>> searchItemsByName(String query) {
        List<Map<String, Object>> results = new ArrayList<>();
        for (Pair<Integer, String> item : ItemInformationProvider.getInstance().getAllItems()) {
            if (item.getRight().toLowerCase().contains(query.toLowerCase())) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("id", item.getLeft());
                entry.put("name", item.getRight());
                results.add(entry);
            }
        }
        return results;
    }


    public void makeNpc(int npcid) {
        makeNpc(npcid, getPlayer().getPosition().x, getPlayer().getPosition().y);
    }
    public void gainEquip(Equip equip, boolean showMessage) {
        super.gainEquip(equip, showMessage);
    }
    public boolean haveItemWithId(int itemid, boolean checkEquipped) {
        return super.haveItemWithId(itemid, checkEquipped); // Calls the parent's method
    }
    public void updateRingStats(int ringId, int jump, int speed) {
        super.updateRingStats(ringId, jump, speed);
    }
    // Checks if EQUIP inventory has a free slot
    public boolean canHoldEquip() {
        return getPlayer().getInventory(client.inventory.InventoryType.EQUIP).getNextFreeSlot() > 0;
    }
    public int countItems(int itemId) {
        int count = getPlayer().getInventory(client.inventory.InventoryType.EQUIP).countById(itemId);
        count += getPlayer().getInventory(client.inventory.InventoryType.EQUIPPED).countById(itemId);
        count += getPlayer().getInventory(client.inventory.InventoryType.CASH).countById(itemId);
        return count;
    }
    public void removeAllRings(int ringId) {
        // Remove all from equipped, inventory, and cash tabs
        int count = getPlayer().getInventory(InventoryType.EQUIPPED).countById(ringId);
        if (count > 0) InventoryManipulator.removeById(getClient(), InventoryType.EQUIPPED, ringId, count, false, false);

        count = getPlayer().getInventory(InventoryType.EQUIP).countById(ringId);
        if (count > 0) InventoryManipulator.removeById(getClient(), InventoryType.EQUIP, ringId, count, false, false);

        count = getPlayer().getInventory(InventoryType.CASH).countById(ringId);
        if (count > 0) InventoryManipulator.removeById(getClient(), InventoryType.CASH, ringId, count, false, false);
    }

    // Slayer System wrappers for scripts

    public int getSlayerLevel() { return getPlayer().getSlayerLevel(); }
    public void setSlayerLevel(int level) { getPlayer().setSlayerLevel(level); }

    public int getSlayerExp() { return getPlayer().getSlayerExp(); }
    public void setSlayerExp(int exp) { getPlayer().setSlayerExp(exp); }

    public int getSlayerPoints() { return getPlayer().getSlayerPoints(); }
    public void setSlayerPoints(int pts) { getPlayer().setSlayerPoints(pts); }

    public int getSlayerTaskMonsterId() { return getPlayer().getSlayerTaskMonsterId(); }
    public void setSlayerTaskMonsterId(int id) { getPlayer().setSlayerTaskMonsterId(id); }

    public int getSlayerTaskGoal() { return getPlayer().getSlayerTaskGoal(); }
    public void setSlayerTaskGoal(int goal) { getPlayer().setSlayerTaskGoal(goal); }

    public int getSlayerTaskProgress() { return getPlayer().getSlayerTaskProgress(); }
    public void setSlayerTaskProgress(int progress) { getPlayer().setSlayerTaskProgress(progress); }

    public void addSlayerExp(int exp) { getPlayer().addSlayerExp(exp); }

    public int calculateSlayerPoints(int goal, int level) {
        return server.slayer.SlayerTaskData.calculatePoints(goal, level);
    }

    public List<Map<String, Object>> getAllSlayerTasks() {
        List<Map<String, Object>> tasks = new ArrayList<>();
        for (server.slayer.SlayerTaskData.Task t : server.slayer.SlayerTaskData.TASKS) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.monsterId);
            map.put("name", t.name);
            map.put("level", t.requiredLevel);
            map.put("exp", t.expReward);
            map.put("goalMin", t.goalMin);
            map.put("goalMax", t.goalMax);

            // Optionally: Preview max possible points for the task
            map.put("ptsPreview", SlayerTaskData.calculatePoints(t.goalMax, t.requiredLevel));

            // REMOVE this line!
            // map.put("pts", t.points);

            tasks.add(map);
        }
        return tasks;
    }

    public Map<String, Object> getCurrentSlayerTask() {
        int id = getPlayer().getSlayerTaskMonsterId();
        for (server.slayer.SlayerTaskData.Task t : server.slayer.SlayerTaskData.TASKS) {
            if (t.monsterId == id) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", t.monsterId);
                map.put("name", t.name);
                map.put("level", t.requiredLevel);
                map.put("goalMin", t.goalMin);
                map.put("goalMax", t.goalMax);

                // Optionally: Show the points for player's *current* assigned goal
                int playerGoal = getPlayer().getSlayerTaskGoal();
                map.put("ptsNow", SlayerTaskData.calculatePoints(playerGoal, t.requiredLevel));

                // REMOVE this line!
                // map.put("pts", t.points);

                return map;
            }
        }
        return null;
    }



}