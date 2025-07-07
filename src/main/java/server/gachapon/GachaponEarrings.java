package server.gachapon;

public class GachaponEarrings extends GachaponItems {

    @Override
    public int[] getCommonItems() {
        return new int[]{
                // Earring
                1030000, 1032024, 1032029, 1032036, 1032051, 1032052, 1032053, 1032054, 1032063, 1032071, 1032072, 1032073, 1032074, 1032138, 1032145,
                1032192, 1032204, 1032228, 1032233, 1032234, 1032255, 1032260, 1032310, 1032315, 1032320, 1032321, 1032322, 1032324, 1032328, 1032332,
                1032333, 1032334, 1032335, 1032337, 1032338, 1032341, 1033000
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
