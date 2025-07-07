package server.gachapon;

public class GachaponHat extends GachaponItems {

    @Override
    public int[] getCommonItems() {
        return new int[] {
                // Hat
                // Fill in your hat item IDs below:
                1000000, 1001000, 1002000, 1002001, 1002002, 1002003, 1002004, 1002005, 1002006, 1002007, 1002008, 1002009,
                1002010, 1002011, 1002012, 1002013, 1002014, 1002015, 1002016, 1002017, 1002018, 1002019, 1002020, 1002021,
                // ...and so on! (add all your desired hat item IDs here)
        };
    }

    @Override
    public int[] getUncommonItems() {
        return new int[0];
    }

    @Override
    public int[] getRareItems() {
        return new int[0];
    }
}
