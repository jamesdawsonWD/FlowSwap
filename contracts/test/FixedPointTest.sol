pragma solidity 0.8.13;

library FixedPointTest {
    uint224 constant Q112 = 2**112;
    uint8 public constant RESOLUTION = 112;
    struct uq112x112 {
        uint224 _x;
    }
    struct uq144x112 {
        uint256 _x;
    }

    // encode a uint112 as a UQ112x112
    function encode(uint112 y) public pure returns (uint224 z) {
        z = uint224(y) * Q112; // never overflows
    }

    // divide a UQ112x112 by a uint112, returning a UQ112x112
    function uqdiv(uint224 x, uint112 y) public pure returns (uint256 z) {
        z = uint256(x / uint224(y));
    }

    function decode(uq112x112 memory self) public pure returns (uint112) {
        return uint112(self._x >> RESOLUTION);
    }

    function makeUq112x112(uint224 x) public pure returns (uq112x112 memory) {
        return uq112x112(x);
    }

    function decode144(uq144x112 memory self) public pure returns (uint144) {
        return uint144(self._x >> RESOLUTION);
    }
    function decode144Uint(uint224 x) public pure returns (uint144) {
        return uint144(x >> RESOLUTION);
    }

    function mul(uq112x112 memory self, uint256 y)
        public
        pure
        returns (uq144x112 memory)
    {
        uint256 z = 0;
        require(
            y == 0 || (z = self._x * y) / y == self._x,
            'FixedPoint::mul: overflow'
        );
        return uq144x112(z);
    }
}
