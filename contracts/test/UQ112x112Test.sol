pragma solidity 0.8.13;
import '@uniswap/lib/contracts/libraries/FixedPoint.sol';

contract UQ112x112Test {
    uint224 constant Q112 = 2**112;
    uint8 public constant RESOLUTION = 112;
    struct uq112x112 {
        uint224 _x;
    }

    // encode a uint112 as a UQ112x112
    function encode(uint112 y) public pure returns (uint224 z) {
        z = uint224(y) * Q112; // never overflows
    }

    // divide a UQ112x112 by a uint112, returning a UQ112x112
    function uqdiv(uint224 x, uint112 y) public pure returns (uint256 z) {
        z = uint256(x / uint224(y));
    }

    function decode(uq112x112 memory self) internal pure returns (uint112) {
        return uint112(self._x >> RESOLUTION);
    }
}
