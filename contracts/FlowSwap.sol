// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import {IFlowSwap} from "./interfaces/IFlowSwap.sol";
import {IFlowSwapToken} from "./interfaces/IFlowSwapToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {UQ112x112} from "./libraries/UQ112x112.sol";
import {Math} from "./libraries/Math.sol";
import {FlowSwapERC20} from "./FlowSwapERC20.sol";

contract FlowSwap is IFlowSwap, FlowSwapERC20 {
    using UQ112x112 for uint224;
    using SafeMath for uint256;
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

    IConstantFlowAgreementV1 public cfa;
    ISuperToken public token0;
    ISuperToken public token1;
    IFlowSwapToken public flowToken0;
    IFlowSwapToken public flowToken1;
    address private flowTokenProxy;

    mapping(uint256 => Reciept) private points;
    mapping(address => User) private swaps;

    uint256 public totalPoints;
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    int112 private settledReserve0; // uses single storage slot, accessible via getReserves
    int112 private settledReserve1; // uses single storage slot, accessible via getReserves
    uint32 public blockTimestampLast; // uses single storage slot, accessible via getReserves
    int96 public token0GlobalFlowRate;
    int96 public token1GlobalFlowRate;

    constructor(address _constantFlowAgreement, address _flowTokenProxy) {
        flowTokenProxy = _flowTokenProxy;
        cfa = IConstantFlowAgreementV1(_constantFlowAgreement);
    }

    function _safeTransfer(
        address token,
        address to,
        uint256 value
    ) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "UniswapV2: TRANSFER_FAILED");
    }

    function pointAt(uint256 _pointId) external view returns (Reciept memory) {
        return points[_pointId];
    }

    function swapOf(address _user) external view returns (User memory) {
        return swaps[_user];
    }

    function getNow() external view returns (uint256) {
        return block.timestamp;
    }

    function initialize(address _underlyingToken0, address _underlyingToken1) external {
        address _token0 = Clones.clone(flowTokenProxy);
        address _token1 = Clones.clone(flowTokenProxy);

        token0 = ISuperToken(_underlyingToken0);
        token1 = ISuperToken(_underlyingToken1);

        IFlowSwapToken(_token0).initialize(token0, token0.decimals(), token0.name(), token0.symbol(), address(this));
        IFlowSwapToken(_token1).initialize(token1, token1.decimals(), token1.name(), token1.symbol(), address(this));

        flowToken0 = IFlowSwapToken(_token0);
        flowToken1 = IFlowSwapToken(_token1);
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

    function _update(
        uint256 _balance0,
        uint256 _balance1,
        uint112 _reserve0,
        uint112 _reserve1
    ) private {
        // calculates the current flow as an integer
        // set the current time as last update
        // calculates the total flowed into the contract from the previous flow rate * time
        uint32 timestamp = uint32(block.timestamp % 2**32);
        uint256 timeElapsed = uint256(timestamp) - uint256(blockTimestampLast);

        settledReserve0 = int112(int256(_balance0));
        settledReserve1 = int112(int256(_balance1));

        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            // * never overflows, and + overflow is desired
            price0CumulativeLast += uint256(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) * timeElapsed;
            price1CumulativeLast += uint256(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) * timeElapsed;
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
            liquidity = Math.min(amount0.mul(_totalSupply) / _reserve0, amount1.mul(_totalSupply) / _reserve1);
        }
        require(liquidity > 0, "UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        _update(balance0, balance1, _reserve0, _reserve1);
        // if (feeOn) kLast = uint256(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
        emit Mint(msg.sender, amount0, amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to) external returns (uint256 amount0, uint256 amount1) {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        uint256 liquidity = balanceOf[address(this)];

        uint256 _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
        amount0 = liquidity.mul(balance0) / _totalSupply; // using balances ensures pro-rata distribution
        amount1 = liquidity.mul(balance1) / _totalSupply; // using balances ensures pro-rata distribution
        require(amount0 > 0 && amount1 > 0, "UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED");
        _burn(address(this), liquidity);

        address _token0 = address(token0);
        address _token1 = address(token1);
        //unwrap token and then transfer
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);
        balance0 = ISuperToken(_token0).balanceOf(address(this));
        balance1 = ISuperToken(_token1).balanceOf(address(this));

        _update(balance0, balance1, _reserve0, _reserve1);
        // if (feeOn) kLast = uint256(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
        emit Burn(msg.sender, amount0, amount1, to);
    }

    function claim(address to) external {
        uint256 balance0 = flowToken0.balanceOf(address(this));
        uint256 balance1 = flowToken1.balanceOf(address(this));
        flowToken0.burn(balance0, "");
        flowToken1.burn(balance1, "");
        _safeTransfer(address(token0), to, balance0);
        _safeTransfer(address(token1), to, balance1);
        // _update(balance0, balance1, _reserve0, _reserve1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function createFlow(bytes32 flowId, bool flowDirection) external {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        ISuperToken from = flowDirection ? ISuperToken(token0) : ISuperToken(token1);
        (, int96 flowRate, , ) = cfa.getFlow(from, msg.sender, address(this));

        require(flowRate > 0, "FlowSwap: Steam must exist");

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));

        _update(balance0, balance1, _reserve0, _reserve1);

        totalPoints += 1;

        int96 _token0FlowRate = flowDirection ? points[totalPoints - 1].token0FlowRate + flowRate : points[totalPoints - 1].token0FlowRate;
        int96 _token1FlowRate = flowDirection ? points[totalPoints - 1].token1FlowRate : points[totalPoints - 1].token1FlowRate + flowRate;

        points[totalPoints] = Reciept({
            executed: block.timestamp,
            token0FlowRate: _token0FlowRate,
            token1FlowRate: _token1FlowRate,
            price0CumulativeStart: price0CumulativeLast,
            price1CumulativeStart: price1CumulativeLast
        });
        swaps[msg.sender] = User({flowRate: flowRate, startPoint: totalPoints});
        token0GlobalFlowRate = flowDirection ? token0GlobalFlowRate : token0GlobalFlowRate + flowRate;
        token1GlobalFlowRate = flowDirection ? token1GlobalFlowRate + flowRate : token1GlobalFlowRate;

        emit Created(msg.sender, _token0FlowRate, _token1FlowRate, totalPoints);
    }

    function reserve0() public view returns (uint112) {
        return uint112(uint256(settledReserve0 + token0GlobalFlowRate * int256(block.timestamp - blockTimestampLast)));
    }

    function reserve1() public view returns (uint112) {
        return uint112(uint256(settledReserve1 + token1GlobalFlowRate * int256(block.timestamp - blockTimestampLast)));
    }

    function price0CumulativeNow() public view returns (uint256) {
        return
            price0CumulativeLast +
            uint256(UQ112x112.encode(reserve1()).uqdiv(reserve0())) *
            (uint256(uint32(block.timestamp % 2**32)) - uint256(blockTimestampLast));
    }

    function price1CumulativeNow() public view returns (uint256) {
        return
            price1CumulativeLast +
            uint256(UQ112x112.encode(reserve0()).uqdiv(reserve1())) *
            (uint256(uint32(block.timestamp % 2**32)) - uint256(blockTimestampLast));
    }

    function getPriceCumulativeLast(address token) public view returns (uint256 priceCumulativeLast) {
        if (token == address(token0)) {
            priceCumulativeLast = price0CumulativeNow();
        } else {
            priceCumulativeLast = price1CumulativeNow();
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
        _update(token0.balanceOf(address(this)), token1.balanceOf(address(this)), reserve0(), reserve1());
    }
}
