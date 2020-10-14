pragma solidity ^0.7;

// Some inspiration were taken from FixidityLib, but stripped down as overflow is most likely not going to happen

library FixedMath {
    /**
     * @notice This is 1 in the fixed point units used in this library.
     * @dev fixed1() equals 10^24
     * Hardcoded to 24 digits.
     */
    function fixed1() public pure returns(int256) {
        return 1000000000000000000000000;
    }

    /**
    @dev Convert an int256 to fixed number with 24 decimal points
     */
    function toFixed(int256 num) public pure returns(int256){
        return num * fixed1();
    }

    function add(int256 x, int256 y) public pure returns(int256){
        int256 z = x + y;
        if (x > 0 && y > 0) assert(z > x && z > y);
        if (x < 0 && y < 0) assert(z < x && z < y);
        return z;
    }

    function divide(int256 x, int256 y) public pure returns(int256){
        if (y == fixed1()) return x;
        assert(y != 0);
        return multiply(x, reciprocal(y));
    }

    function sqrt(int256 x) public pure returns(int256){
        
    }
}