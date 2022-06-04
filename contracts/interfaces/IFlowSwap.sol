// SPDX-License-Identifier: AGPLv3
pragma solidity >=0.8.0;

interface IFlowSwap {
    struct Reciept {
        int96 flowRate;
        uint256 deposit;
        bool active;
        uint256 executed;
        uint256 priceCumulativeStart;
    }

    /**************************************************************************
     * Basic information
     *************************************************************************/
    function createFlow(bytes32 flowId, bool flowDirection) external;

    function reserve0() external view returns (uint112);

    function reserve1() external view returns (uint112);

    function swapOf(address _user) external view returns (Reciept memory);

    function blockTimestampLast() external view returns (uint32);

    function initialize(address underlyingToken0, address underlyingToken1)
        external;

    function getPriceCumulativeLast(address token)
        external
        view
        returns (uint256 priceCumulativeLast);

    function getNow() external view returns (uint256);

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Created(
        address indexed sender,
        int96 token0FlowRate,
        int96 token1FlowRate
    );
    event Burn(
        address indexed sender,
        uint256 amount0,
        uint256 amount1,
        address indexed to
    );
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);
}
