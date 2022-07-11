pragma solidity 0.8.13;
import '../libraries/FixedPoint.sol';

contract PriceTest {
    using FixedPoint for *;

    function getAveragePrice(
        uint256 priceCumulativeLast,
        uint256 priceCumulativeStart,
        uint256 timeElapsed
    ) public pure returns (uint144 amount) {
        FixedPoint.uq112x112 memory averagePrice = FixedPoint.uq112x112(
            uint224((priceCumulativeLast - priceCumulativeStart) / timeElapsed)
        );
        amount = averagePrice.mul(1).decode144();
    }
}
