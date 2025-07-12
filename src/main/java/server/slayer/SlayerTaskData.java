package server.slayer;

public class SlayerTaskData {
    public static class Task {
        public int monsterId, requiredLevel, expReward, goalMin, goalMax;
        public String name;
        public Task(int monsterId, String name, int requiredLevel, int expReward, int goalMin, int goalMax) {
            this.monsterId = monsterId;
            this.name = name;
            this.requiredLevel = requiredLevel;
            this.expReward = expReward;
            this.goalMin = goalMin;
            this.goalMax = goalMax;
        }
    }

    // Update your TASKS to use min/max
    public static final Task[] TASKS = new Task[] {
            new Task(100100, "Snail",      1,  10,  30,  50),   // 30-50
            new Task(100101, "Blue Snail", 3,  15,  40,  60),   // 40-60
            new Task(120100, "Shroom",     8,  20,  60,  90),   // 60-90
            new Task(130100, "Stump",     12,  30, 120, 140),   // 120-140
            new Task(130101, "Red Snail",  6,  40, 200, 250),   // 200-250
            new Task(2220000, "Mano",     18, 150,   5,  12)    // 5-12
    };
    // In SlayerTaskData
    public static Task getTaskForMob(int mobId) {
        for (Task t : TASKS) {
            if (t.monsterId == mobId) return t;
        }
        return null;
    }
    public static int calculatePoints(int goal, int requiredLevel) {
        // Example: 1 point per 6 kills, plus 1 point per 5 required levels, minimum 1
        return Math.max(1, (int)Math.ceil(goal / 6.0) + (requiredLevel / 5));
    }
}
