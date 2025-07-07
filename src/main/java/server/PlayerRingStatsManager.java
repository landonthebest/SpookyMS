package server;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import tools.DatabaseConnection;

public class PlayerRingStatsManager {

    public static PlayerRingStats getStats(int charId, int itemId) {
        PlayerRingStats stats = null;
        try (Connection con = DatabaseConnection.getConnection();
             PreparedStatement ps = con.prepareStatement("SELECT jump, speed FROM player_ring_stats WHERE charid=? AND itemid=?")) {
            ps.setInt(1, charId);
            ps.setInt(2, itemId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    stats = new PlayerRingStats(rs.getInt("jump"), rs.getInt("speed"));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return stats;
    }

    public static void saveStats(int charId, int itemId, int jump, int speed) {
        try (Connection con = DatabaseConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(
                     "INSERT INTO player_ring_stats (charid, itemid, jump, speed) VALUES (?, ?, ?, ?) " +
                             "ON DUPLICATE KEY UPDATE jump=?, speed=?"
             )) {
            ps.setInt(1, charId);
            ps.setInt(2, itemId);
            ps.setInt(3, jump);
            ps.setInt(4, speed);
            ps.setInt(5, jump);
            ps.setInt(6, speed);
            ps.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static class PlayerRingStats {
        public int jump, speed;
        public PlayerRingStats(int jump, int speed) { this.jump = jump; this.speed = speed; }
    }

}
