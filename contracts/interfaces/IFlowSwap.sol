// SPDX-License-Identifier: AGPLv3
pragma solidity >=0.8.0;

interface IFlowSwap {
    struct User {
        int96 flowRate;
        uint256 startPoint;
    }

    struct Reciept {
        uint256 executed;
        int96 token0FlowRate;
        int96 token1FlowRate;
        uint256 price0CumulativeStart;
        uint256 price1CumulativeStart;
    }

    /**************************************************************************
     * Basic information
     *************************************************************************/
    function createFlow(bytes32 flowId, bool flowDirection) external;

    function reserve0() external view returns (uint112);

    function reserve1() external view returns (uint112);

    function pointAt(uint256 _pointId) external view returns (Reciept memory);

    function swapOf(address _user) external view returns (User memory);

    function blockTimestampLast() external view returns (uint32);

    function totalPoints() external view returns (uint256);

    function getPriceCumulativeLast(address token) external view returns (uint256 priceCumulativeLast);

    function getNow() external view returns (uint256);

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Created(address indexed sender, int96 token0FlowRate, int96 token1FlowRate, uint256 startPoint);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to);
    event Sync(uint112 reserve0, uint112 reserve1);
}
