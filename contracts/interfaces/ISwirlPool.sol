// SPDX-License-Identifier: AGPLv3
pragma solidity >=0.8.0;
import {ISuperToken, ISuperfluid} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol';
import {IConstantFlowAgreementV1} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol';
import {CFAv1Library} from '../superfluid/CFAv1Library.sol';

interface ISwirlPool {
    struct Reciept {
        uint96 flowRate;
        address from;
        uint32 executed;
        uint256 priceCumulativeStart;
    }

    struct InitParams {
        ISuperfluid host;
        address lp;
        address underlyingToken0;
        address underlyingToken1;
        address swirlToken0;
        address swirlToken1;
    }

    /**************************************************************************
     * Basic information
     *************************************************************************/

    function reserve0() external view returns (uint112);

    function reserve1() external view returns (uint112);

    function token0() external view returns (ISuperToken);

    function token1() external view returns (ISuperToken);

    function host() external view returns (ISuperfluid);

    function getCfa() external view returns (CFAv1Library.InitData memory);

    function CFA_ID() external view returns (bytes32);

    function swirl(
        int96 flowRate,
        address sender,
        ISuperToken from
    ) external;

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

    function initialize(InitParams memory params) external;

    function getNow() external view returns (uint256);

    function price0CumulativeLast() external view returns (uint256);

    function price1CumulativeLast() external view returns (uint256);

    function mint(
        address to,
        uint256 amount0,
        uint256 amount1
    ) external returns (uint256 liquidity);

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
    event Sync(
        uint112 reserve0,
        uint112 reserve1,
        uint32 timeElapsed,
        uint32 blocktimestampLast
    );

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
