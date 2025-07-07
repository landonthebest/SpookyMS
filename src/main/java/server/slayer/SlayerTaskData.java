package server.slayer;

public class SlayerTaskData {
    public static class Task {
        public int monsterId, requiredLevel, expReward, goal;
        public String name;
        public Task(int monsterId, String name, int requiredLevel, int expReward, int goal) {
            this.monsterId = monsterId;
            this.name = name;
            this.requiredLevel = requiredLevel;
            this.expReward = expReward;
            this.goal = goal;
        }
    }

    public static final Task[] TASKS = new Task[] {
            new Task(100100, "Snail", 1, 10, 40),
            new Task(100101, "Blue Snail", 3, 15, 50),
            new Task(120100, "Shroom", 8, 20, 75),
            new Task(130100, "Stump", 12, 30, 130),
            new Task(130101, "Red Snail", 6, 40, 230),
            new Task(2220000, "Mano", 18, 150, 8) // Boss
    };
    // In SlayerTaskData
    public static Task getTaskForMob(int mobId) {
        for (Task t : TASKS) {
            if (t.monsterId == mobId) return t;
        }
        return null;
    }
}
