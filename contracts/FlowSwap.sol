// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import {IFlowSwap} from './interfaces/IFlowSwap.sol';
import {IFlowFactory} from './interfaces/IFlowFactory.sol';
import {IFlowSwapERC20} from './interfaces/IFlowSwapERC20.sol';
import {IFlowSwapToken} from './interfaces/IFlowSwapToken.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {Clones} from '@openzeppelin/contracts/proxy/Clones.sol';
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import {UQ112x112} from './libraries/UQ112x112.sol';
import {Math} from './libraries/Math.sol';
import {FlowSwapERC20} from './FlowSwapERC20.sol';
import {ISuperfluid, SuperAppDefinitions, ISuperToken, ISuperAgreement} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol';
import {IConstantFlowAgreementV1} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol';
import {CFAv1Library} from './superfluid/CFAv1Library.sol';

contract FlowSwap is IFlowSwap, FlowSwapERC20 {
    using UQ112x112 for uint224;
    using SafeMath for uint256;
    using CFAv1Library for CFAv1Library.InitData;

    struct Vector {
        int256 x;
        int256 y;
    }

    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    bytes32 public constant CFA_ID =
        keccak256('org.superfluid-finance.agreements.ConstantFlowAgreement.v1');
    bytes4 private constant SELECTOR =
        bytes4(keccak256(bytes('transfer(address,uint256)')));

    CFAv1Library.InitData public cfaV1;
    ISuperToken public token0;
    ISuperToken public token1;
    IFlowSwapToken public flowToken0;
    IFlowSwapToken public flowToken1;
    IFlowFactory public factory;
    ISuperfluid public host;
    IFlowSwapERC20 public lp;
    address public superRouter;

    mapping(address => Reciept) private swaps;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;

    uint112 public settledReserve0; // uses single storage slot, accessible via getReserves
    uint112 public settledReserve1; // uses single storage slot, accessible via getReserves
    uint32 public blockTimestampLast; // uses single storage slot, accessible via getReserves

    uint96 public token0GlobalFlowRate;
    uint96 public token1GlobalFlowRate;

    uint256 public kLast;
    int256 public c0;
    int256 public c1;
    int256 public m0;
    int256 public m1;

    function initialize(InitParams memory params) external {
        host = params.host;

        superRouter = params.superRouter;

        lp = IFlowSwapERC20(params.lp);

        cfaV1 = CFAv1Library.InitData(
            host,
            IConstantFlowAgreementV1(address(host.getAgreementClass(CFA_ID)))
        );
        factory = IFlowFactory(msg.sender);

        token0 = ISuperToken(params.underlyingToken0);
        token1 = ISuperToken(params.underlyingToken1);

        flowToken0 = IFlowSwapToken(params.flowToken0);
        flowToken1 = IFlowSwapToken(params.flowToken1);
    }

    function _update(
        uint256 _balance0,
        uint256 _balance1,
        uint112 _reserve0,
        uint112 _reserve1
    ) private {
        uint32 timestamp = uint32(block.timestamp % 2**32);
        uint256 timeElapsed = uint256(timestamp) - uint256(blockTimestampLast);

        settledReserve0 = _reserve0;
        settledReserve1 = _reserve1;

        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            int256 token0NetFlowRate = int96(token0GlobalFlowRate) -
                int256(
                    uint256(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) *
                        token0GlobalFlowRate
                );
            int256 token1NetFlowRate = int96(token0GlobalFlowRate) -
                int256(
                    uint256(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) *
                        token0GlobalFlowRate
                );

            Vector memory token0FirstPoint = Vector({
                x: int256(uint256(_reserve0)),
                y: 0
            });
            Vector memory token1FirstPoint = Vector({
                x: int256(uint256(_reserve1)),
                y: 0
            });

            Vector memory token0SecondPoint = Vector({
                x: int256(uint256(_reserve0)) + token0NetFlowRate,
                y: 1
            });

            Vector memory token1SecondPoint = Vector({
                x: int256(uint256(_reserve1)) + token1NetFlowRate,
                y: 1
            });

            m0 =
                (token0SecondPoint.y - token0FirstPoint.y) /
                (token0SecondPoint.x - token0FirstPoint.x);
            m1 =
                (token1SecondPoint.y - token1FirstPoint.y) /
                (token1SecondPoint.x - token1FirstPoint.x);

            c0 = token0SecondPoint.y - m0 * token0SecondPoint.x;
            c1 = token1SecondPoint.y - m1 * token1SecondPoint.x;

            // * never overflows, and + overflow is desired
            price0CumulativeLast +=
                uint256(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) *
                timeElapsed;
            price1CumulativeLast +=
                uint256(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) *
                timeElapsed;
        }
        blockTimestampLast = timestamp;
    }

    // this low-level function should be called from a contract which performs important safety checks
    function mint(address to) external returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        uint256 amount0 = balance0.sub(_reserve0);
        uint256 amount1 = balance1.sub(_reserve1);

        uint256 _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
            _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(
                amount0.mul(_totalSupply) / _reserve0,
                amount1.mul(_totalSupply) / _reserve1
            );
        }
        require(liquidity > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED');
        _mint(to, liquidity);

        // _update(balance0, balance1, _reserve0, _reserve1);
        emit Mint(msg.sender, liquidity, amount0, amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to)
        external
        returns (uint256 amount0, uint256 amount1)
    {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));

        uint256 _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
        amount0 = liquidity.mul(balance0) / _totalSupply; // using balances ensures pro-rata distribution
        amount1 = liquidity.mul(balance1) / _totalSupply; // using balances ensures pro-rata distribution
        require(
            amount0 > 0 && amount1 > 0,
            'UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED'
        );
        _burn(address(this), liquidity);

        address _token0 = address(token0);
        address _token1 = address(token1);
        //unwrap token and then transfer
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);
        balance0 = ISuperToken(_token0).balanceOf(address(this));
        balance1 = ISuperToken(_token1).balanceOf(address(this));

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     *   Claim - turns wrapped Super Tokens back into super tokens
     *   @param to - the address for the tokens to be sent
     */
    function claim(address to) external {
        uint256 balance0 = flowToken0.balanceOf(address(this));
        uint256 balance1 = flowToken1.balanceOf(address(this));
        flowToken0.burn(balance0, '');
        flowToken1.burn(balance1, '');
        _safeTransfer(address(token0), to, balance0);
        _safeTransfer(address(token1), to, balance1);
        // _update(balance0, balance1, _reserve0, _reserve1);
    }

    /**
     *   terminate - closes a swirl
     *   @param ctx - id of the previously created flow
     *   @param token - the supertoken being streamed in
     */
    function terminate(bytes calldata ctx, ISuperToken token)
        external
        onlySuperRouter
        returns (bytes memory newCtx)
    {
        newCtx = ctx;
        ISuperfluid.Context memory decompiledContext = host.decodeCtx(ctx);
        address sender = decompiledContext.msgSender;
        (, int96 flowRate, , ) = cfaV1.cfa.getFlow(
            ISuperToken(token),
            sender,
            address(this)
        );

        swaps[sender].active = false;
        swaps[sender].flowRate = 0;
    }

    /**
     *   createFlow - takes a previosuly created superfluid flow and creates a flowswap
     *   @param ctx - id of the previously created flow
     *   @param from - the supertoken being streamed in
     */
    function createFlow(bytes calldata ctx, ISuperToken from)
        external
        onlySuperRouter
        returns (bytes memory newCtx)
    {
        newCtx = ctx;

        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        ISuperfluid.Context memory decompiledContext = host.decodeCtx(ctx);
        address sender = decompiledContext.msgSender;

        (, int96 flowRate, , ) = cfaV1.cfa.getFlow(
            ISuperToken(from),
            sender,
            address(this)
        );

        // require(flowRate > 0, 'FlowSwap: Stream must exist');

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        _update(balance0, balance1, _reserve0, _reserve1);

        uint96 previousFlowRate = swaps[sender].flowRate;

        swaps[sender] = Reciept({
            flowRate: uint96(flowRate),
            active: true,
            priceCumulativeStart: getPriceCumulativeLast(address(from)),
            executed: block.timestamp
        });

        if (ISuperToken(from) == token0) {
            token0GlobalFlowRate =
                token0GlobalFlowRate -
                previousFlowRate +
                uint96(flowRate);
        } else {
            token1GlobalFlowRate =
                token1GlobalFlowRate -
                previousFlowRate +
                uint96(flowRate);
        }

        emit Created(sender, token0GlobalFlowRate, token1GlobalFlowRate);
    }

    function swapOf(address who) external view returns (Reciept memory) {
        return swaps[who];
    }

    //TODO: check how superfluid actually implements this :D
    function getNow() external view returns (uint256) {
        return block.timestamp;
    }

    function kNow() public view returns (uint256) {
        address feeTo = IFlowFactory(factory).feeTo();
        bool feeOn = feeTo != address(0);
        return feeOn ? uint256(reserve0()).mul(reserve1()) : 0;
    }

    function feeAvailable() external view returns (uint256 liquidity) {
        address feeTo = IFlowFactory(factory).feeTo();
        bool feeOn = feeTo != address(0);
        uint256 _kLast = kNow(); // gas savings
        if (feeOn) {
            if (_kLast != 0) {
                uint256 rootK = Math.sqrt(uint256(reserve0()).mul(reserve1()));
                uint256 rootKLast = Math.sqrt(_kLast);
                if (rootK > rootKLast) {
                    uint256 numerator = totalSupply.mul(rootK.sub(rootKLast));
                    uint256 denominator = rootK.mul(5).add(rootKLast);
                    liquidity = numerator / denominator;
                }
            }
        }
    }

    function reserve0() public view returns (uint112) {
        uint256 timeElapsed = (block.timestamp - blockTimestampLast);
        uint256 reserve = timeElapsed == 0 || settledReserve0 == 0
            ? settledReserve0
            : uint112(int112((int256(timeElapsed) - c0) / m0));
        return uint112(reserve);
    }

    function reserve1() public view returns (uint112) {
        uint256 timeElapsed = (block.timestamp - blockTimestampLast);
        uint256 reserve = timeElapsed == 0 || settledReserve1 == 0
            ? settledReserve1
            : uint112(int112((int256(timeElapsed) - c1) / m1));
        return uint112(reserve);
    }

    function getReserves()
        public
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 _blockTimestampLast
        )
    {
        _reserve0 = reserve0();
        _reserve1 = reserve1();
        _blockTimestampLast = blockTimestampLast;
    }

    function price0CumulativeNow() public view returns (uint256) {
        return
            price0CumulativeLast +
            uint256(UQ112x112.encode(reserve1()).uqdiv(reserve0())) *
            (uint256(uint32(block.timestamp % 2**32)) -
                uint256(blockTimestampLast));
    }

    function price1CumulativeNow() public view returns (uint256) {
        return
            price1CumulativeLast +
            uint256(UQ112x112.encode(reserve0()).uqdiv(reserve1())) *
            (uint256(uint32(block.timestamp % 2**32)) -
                uint256(blockTimestampLast));
    }

    function getPriceCumulativeNow(address token)
        public
        view
        returns (uint256 priceCumulativeLast)
    {
        if (token == address(token0)) {
            priceCumulativeLast = price1CumulativeNow();
        } else {
            priceCumulativeLast = price0CumulativeNow();
        }
    }

    function getPriceCumulativeLast(address token)
        public
        view
        returns (uint256 priceCumulativeLast)
    {
        if (token == address(token0)) {
            priceCumulativeLast = price1CumulativeLast;
        } else {
            priceCumulativeLast = price0CumulativeLast;
        }
    }

    // force balances to match reserves
    function skim(address to) external {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        address _token0 = address(token0); // gas savings
        address _token1 = address(token1); // gas savings
        uint256 _balance0 = token0.balanceOf(address(this));
        uint256 _balance1 = token1.balanceOf(address(this));
        _safeTransfer(_token0, to, _balance0 - _reserve0);
        _safeTransfer(_token1, to, _balance1 - _reserve1);
    }

    // force reserves to match balances
    function sync() external {
        _update(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this)),
            reserve0(),
            reserve1()
        );
    }

    /**************************************************************************
     * Private functions
     *************************************************************************/
    function _safeTransfer(
        address token,
        address to,
        uint256 value
    ) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(SELECTOR, to, value)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            'UniswapV2: TRANSFER_FAILED'
        );
    }

    modifier onlySuperRouter() {
        require(
            msg.sender == address(superRouter),
            'FlowSwap: only super router'
        );
        _;
    }

    /**************************************************************************
     * Getter functions
     *************************************************************************/

    function getCfa() external view returns (CFAv1Library.InitData memory) {
        return cfaV1;
    }
}
