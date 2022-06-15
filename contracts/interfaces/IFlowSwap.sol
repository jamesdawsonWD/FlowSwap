// SPDX-License-Identifier: AGPLv3
pragma solidity >=0.8.0;
import {ISuperToken, ISuperfluid} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol';
import {IConstantFlowAgreementV1} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol';
import {CFAv1Library} from '../superfluid/CFAv1Library.sol';

interface IFlowSwap {
    struct Reciept {
        uint96 flowRate;
        bool active;
        uint256 executed;
        uint256 priceCumulativeStart;
    }

    struct InitParams {
        ISuperfluid host;
        address lp;
        address underlyingToken0;
        address underlyingToken1;
        address flowToken0;
        address flowToken1;
        address superRouter;
    }

    /**************************************************************************
     * Basic information
     *************************************************************************/

    function reserve0() external view returns (uint112);

    function reserve1() external view returns (uint112);

    function token0() external view returns (ISuperToken);

    function token1() external view returns (ISuperToken);

    function getCfa() external view returns (CFAv1Library.InitData memory);

    function CFA_ID() external view returns (bytes32);

    function getReserves()
        external
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 _blockTimestampLast
        );

    function swapOf(address _user) external view returns (Reciept memory);

    function blockTimestampLast() external view returns (uint32);

    function createFlow(bytes calldata ctx, ISuperToken from)
        external
        returns (bytes memory newCtx);

    function terminate(bytes calldata ctx, ISuperToken token)
        external
        returns (bytes memory newCtx);

    function initialize(InitParams memory params) external;

    function getPriceCumulativeNow(address token)
        external
        view
        returns (uint256 priceCumulativeLast);

    function getPriceCumulativeLast(address token)
        external
        view
        returns (uint256 priceCumulativeLast);

    function getNow() external view returns (uint256);

    function price0CumulativeLast() external view returns (uint256);

    function price1CumulativeLast() external view returns (uint256);

    function mint(address to) external returns (uint256 liquidity);

    function burn(address to)
        external
        returns (uint256 amount0, uint256 amount1);

    function skim(address to) external;

    function sync() external;

    event Mint(
        address indexed sender,
        uint256 indexed liquidity,
        uint256 amount0,
        uint256 amount1
    );
    event Created(
        address indexed sender,
        uint96 token0FlowRate,
        uint96 token1FlowRate
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

    event Test(
        address indexed sender,
        address indexed to,
        address indexed from
    );
    event Test1(
        uint256 balance0,
        uint256 balance1,
        uint112 indexed reserve0,
        uint112 indexed reserve1
    );
}
