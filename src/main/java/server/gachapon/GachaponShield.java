package server.gachapon;

public class GachaponShield extends GachaponItems {

    @Override
    public int[] getCommonItems() {
        return new int[] {
                // Shield
                1092031, 1092033, 1092039, 1092040, 1092043, 1092044, 1092051, 1092062,
                1092063, 1092064, 1092065, 1092085, 1092086, 1092108, 1092116, 1092117
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
