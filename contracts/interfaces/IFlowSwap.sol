// SPDX-License-Identifier: AGPLv3
pragma solidity >=0.8.0;

interface IFlowSwap {
    /**************************************************************************
     * Basic information
     *************************************************************************/
    function flowSwap() external view returns (uint256);

    function getNow() external view returns (uint256);

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to);
    event Sync(uint112 reserve0, uint112 reserve1);
}
