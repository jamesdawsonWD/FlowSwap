// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import {ISwirlPool} from './interfaces/ISwirlPool.sol';
import {ISwirlFactory} from './interfaces/ISwirlFactory.sol';
import {ISwirlPoolERC20} from './interfaces/ISwirlPoolERC20.sol';
import {ISwirlPoolToken} from './interfaces/ISwirlPoolToken.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {Clones} from '@openzeppelin/contracts/proxy/Clones.sol';
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import {FixedPoint} from './libraries/FixedPoint.sol';
import {Math} from './libraries/Math.sol';
import {SwirlPoolERC20} from './SwirlPoolERC20.sol';
import {ISwirlPoolERC20} from './interfaces/ISwirlPoolERC20.sol';
import {ISuperfluid, SuperAppDefinitions, ISuperToken, ISuperAgreement} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol';
import {IConstantFlowAgreementV1} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol';
import {CFAv1Library} from './superfluid/CFAv1Library.sol';
import {SuperAppBase} from '@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol';

contract SwirlPool is ISwirlPool, SuperAppBase {
    using FixedPoint for uint224;
    using SafeMath for uint256;
    using CFAv1Library for CFAv1Library.InitData;
    using FixedPoint for FixedPoint.uq112x112;

    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    bytes32 public constant CFA_ID =
        keccak256(
            'org.superfluid-finance.agreements.ConstantFlowAgreement.v1'
        );
    bytes4 private constant SELECTOR =
        bytes4(keccak256(bytes('transfer(address,uint256)')));

    CFAv1Library.InitData public cfaV1;
    ISuperToken public token0;
    ISuperToken public token1;
    ISwirlPoolToken public swirlToken0;
    ISwirlPoolToken public swirlToken1;
    ISwirlFactory public factory;
    ISuperfluid public host;
    ISwirlPoolERC20 public lpToken;

    mapping(address => Reciept) private swaps;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint112 public settledReserve0; // uses single storage slot, accessible via getReserves
    uint112 public settledReserve1; // uses single storage slot, accessible via getReserves
    uint32 public blockTimestampLast; // uses single storage slot, accessible via getReserves

    uint96 public token0GlobalFlowRate;
    uint96 public token1GlobalFlowRate;

    uint256 public kLast;
    uint256 private previousTrade;

    function initialize(InitParams memory params) external {
        factory = ISwirlFactory(msg.sender);
        host = params.host;
        lpToken = ISwirlPoolERC20(params.lp);
        cfaV1 = CFAv1Library.InitData(
            host,
            IConstantFlowAgreementV1(address(host.getAgreementClass(CFA_ID)))
        );
        token0 = ISuperToken(params.underlyingToken0);
        token1 = ISuperToken(params.underlyingToken1);
        swirlToken0 = ISwirlPoolToken(params.swirlToken0);
        swirlToken1 = ISwirlPoolToken(params.swirlToken1);
    }

    function _update(uint112 _reserve0, uint112 _reserve1) private {
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overswirl is desired

        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            // * never overswirls, and + overswirl is desired
            price0CumulativeLast +=
                uint256(FixedPoint.encode(_reserve1).uqdiv(_reserve0)) *
                timeElapsed;
            price1CumulativeLast +=
                uint256(FixedPoint.encode(_reserve0).uqdiv(_reserve1)) *
                timeElapsed;
        }
        kLast = uint256(settledReserve0) * settledReserve1;
        blockTimestampLast = blockTimestamp;
        emit Sync(_reserve0, _reserve1, timeElapsed, blockTimestampLast);
    }

    function _settlePending() private {
        uint256 timeElapsed = (block.timestamp - blockTimestampLast);
        if (timeElapsed > 0 && kLast != 0) {
            uint256 totalswirled0 = token0GlobalFlowRate * timeElapsed;
            uint256 totalswirled1 = token1GlobalFlowRate * timeElapsed;

            uint16 sections = 10;
            uint256 sectionswirled0 = totalswirled0 / sections;
            uint256 sectionswirled1 = totalswirled1 / sections;

            for (uint16 i = 0; i < sections; i++) {
                if (previousTrade % 2 == 0 && totalswirled0 > 0) {
                    (settledReserve0, settledReserve1) = _trade(
                        settledReserve0,
                        settledReserve1,
                        sectionswirled0,
                        sectionswirled1
                    );
                } else {
                    (settledReserve1, settledReserve0) = _trade(
                        settledReserve1,
                        settledReserve0,
                        sectionswirled1,
                        sectionswirled0
                    );
                }

                previousTrade++;
            }
        }
    }

    function _trade(
        uint112 _firstReserve,
        uint112 _secondReserve,
        uint256 _swirled0,
        uint256 _swirled1
    ) private returns (uint112, uint112) {
        if (_swirled0 > 0) {
            _firstReserve += uint112(_swirled0);
            _secondReserve = uint112(kLast / _firstReserve);
        }

        if (_swirled1 > 0) {
            _secondReserve += uint112(_swirled1);
            _firstReserve = uint112(kLast / _secondReserve);
        }

        return (_firstReserve, _secondReserve);
    }

    /**
     *   createswirl - takes a previosuly created superfluid swirl and creates a SwirlPool
     *   @param flowRate - id of the previousy created swirl
     *   @param sender - id of the previously created swirl
     *   @param from - the supertoken being streamed in
     */
    function swirl(
        int96 flowRate,
        address sender,
        ISuperToken from
    ) public {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings

        _settlePending();

        require(flowRate > 0, 'SwirlPool: Stream must exist');

        uint96 previousflowRate = swaps[sender].flowRate;

        if (ISuperToken(from) == token0) {
            token0GlobalFlowRate =
                token0GlobalFlowRate -
                previousflowRate +
                uint96(flowRate);
        } else {
            token1GlobalFlowRate =
                token1GlobalFlowRate -
                previousflowRate +
                uint96(flowRate);
        }
        _update(_reserve0, _reserve1);

        swaps[sender] = Reciept({
            flowRate: uint96(flowRate),
            from: address(from),
            priceCumulativeStart: from == token0
                ? price1CumulativeLast
                : price0CumulativeLast,
            executed: uint32(block.timestamp % 2**32)
        });

        emit Created(sender, token0GlobalFlowRate, token1GlobalFlowRate);
    }

    function mint(
        address to,
        uint256 amount0,
        uint256 amount1
    ) external returns (uint256 liquidity) {
        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);

        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings

        _settlePending();

        uint256 _totalSupply = lpToken.totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
            lpToken.mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(
                amount0.mul(_totalSupply) / _reserve0,
                amount1.mul(_totalSupply) / _reserve1
            );
        }
        require(liquidity > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED');
        lpToken.mint(to, liquidity);

        _update(_reserve0, _reserve1);
        settledReserve0 += uint112(amount0);
        settledReserve1 += uint112(amount1);

        emit Mint(msg.sender, liquidity, amount0, amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to)
        external
        returns (uint256 amount0, uint256 amount1)
    {
        _settlePending();
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        uint256 liquidity = lpToken.balanceOf(address(this));
        uint256 _totalSupply = lpToken.totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
        amount0 = liquidity.mul(balance0) / _totalSupply; // using balances ensures pro-rata distribution
        amount1 = liquidity.mul(balance1) / _totalSupply; // using balances ensures pro-rata distribution
        require(
            amount0 > 0 && amount1 > 0,
            'UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED'
        );
        lpToken.burn(address(this), liquidity);
        address _token0 = address(token0);
        address _token1 = address(token1);
        //unwrap token and then transfer
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);
        balance0 = ISuperToken(_token0).balanceOf(address(this));
        balance1 = ISuperToken(_token1).balanceOf(address(this));
        _update(_reserve0, _reserve1);
        settledReserve0 -= uint112(amount0);
        settledReserve1 -= uint112(amount1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     *   Claim - turns wrapped Super Tokens back into super tokens
     *   @param to - the address for the tokens to be sent
     */
    function claim(address to) external {
        _settlePending();
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings

        uint256 balance0 = swirlToken0.balanceOf(address(this));
        uint256 balance1 = swirlToken1.balanceOf(address(this));

        swirlToken0.burn(balance0, '');
        swirlToken1.burn(balance1, '');

        _safeTransfer(address(token0), to, balance0);
        _safeTransfer(address(token1), to, balance1);

        _update(_reserve0, _reserve1);
    }

    /**
     *   terminate - closes a swirl
     *   @param ctx - id of the previously created swirl
     */
    function terminate(bytes calldata ctx)
        internal
        returns (bytes memory newCtx)
    {
        _settlePending();
        newCtx = ctx;
        ISuperfluid.Context memory decompiledContext = host.decodeCtx(ctx);
        address sender = decompiledContext.msgSender;
        swaps[sender].flowRate = 0;
        swaps[sender].executed = 0;
    }

    function swapOf(address who) external view returns (Reciept memory) {
        return swaps[who];
    }

    //TODO: check how superfluid actually implements this :D
    function getNow() external view returns (uint256) {
        return block.timestamp;
    }

    function kNow() public view returns (uint256) {
        address feeTo = ISwirlFactory(factory).feeTo();
        bool feeOn = feeTo != address(0);
        return feeOn ? uint256(reserve0()).mul(reserve1()) : 0;
    }

    function feeAvailable() external view returns (uint256 liquidity) {
        address feeTo = ISwirlFactory(factory).feeTo();
        bool feeOn = feeTo != address(0);
        uint256 _kLast = kNow(); // gas savings
        if (feeOn) {
            if (_kLast != 0) {
                uint256 rootK = Math.sqrt(uint256(reserve0()).mul(reserve1()));
                uint256 rootKLast = Math.sqrt(_kLast);
                if (rootK > rootKLast) {
                    uint256 numerator = lpToken.totalSupply().mul(
                        rootK.sub(rootKLast)
                    );
                    uint256 denominator = rootK.mul(5).add(rootKLast);
                    liquidity = numerator / denominator;
                }
            }
        }
    }

    function reserve0() public view returns (uint112) {
        return settledReserve0;
    }

    function reserve1() public view returns (uint112) {
        return settledReserve1;
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

    function updateAccount(address account) internal {
        swaps[account] = Reciept({
            flowRate: swaps[account].flowRate,
            from: address(swaps[account].from),
            priceCumulativeStart: swaps[account].from == address(token0)
                ? price1CumulativeLast
                : price0CumulativeLast,
            executed: uint32(block.timestamp % 2**32)
        });
    }

    // force reserves to match balances
    function sync() external {
        _settlePending();
        _update(reserve0(), reserve1());
    }

    /**************************************************************************
     * SuperApp Callbacks
     *************************************************************************/
    function _handleAfterAgreementCreated(
        ISuperToken _superToken,
        address sender
    ) private {
        (, int96 flowRate, , ) = cfaV1.cfa.getFlow(
            ISuperToken(_superToken),
            sender,
            address(this)
        );

        swirl(flowRate, sender, _superToken);
    }

    function afterAgreementCreated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, //_agreementId
        bytes calldata, //_agreementData
        bytes calldata, //_cbdata
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        newCtx = _ctx;
        ISuperfluid.Context memory decompiledContext = host.decodeCtx(_ctx);
        address sender = decompiledContext.msgSender;
        _handleAfterAgreementCreated(_superToken, sender);
    }

    function beforeAgreementUpdated(
        ISuperToken token,
        address agreementClass,
        bytes32 agreementId,
        bytes calldata,
        bytes calldata
    ) external view override returns (bytes memory) {
        if (agreementClass != address(cfaV1.cfa)) return new bytes(0);

        (uint256 timestamp, int96 flowRate, , ) = cfaV1.cfa.getFlowByID(
            token,
            agreementId
        );

        return abi.encode(timestamp, flowRate);
    }

    function _handleAfterAgreementUpdates(
        ISuperToken _superToken,
        address sender,
        int96 previousflowrate
    ) internal {
        (, int96 flowRate, , ) = cfaV1.cfa.getFlow(
            _superToken,
            sender,
            address(this)
        );

        swirl(flowRate, sender, _superToken);
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, // _agreementData,
        bytes calldata cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        newCtx = _ctx;

        ISuperfluid.Context memory decompiledContext = host.decodeCtx(_ctx);
        (, int96 previousflowRate) = abi.decode(cbdata, (uint256, int96));

        _handleAfterAgreementUpdates(
            _superToken,
            decompiledContext.msgSender,
            previousflowRate
        );
    }

    function beforeAgreementTerminated(
        ISuperToken token,
        address agreementClass,
        bytes32 agreementId,
        bytes calldata,
        bytes calldata
    ) external view override returns (bytes memory) {
        if (agreementClass != address(cfaV1.cfa)) return new bytes(0);

        (uint256 timestamp, int96 flowRate, , ) = cfaV1.cfa.getFlowByID(
            token,
            agreementId
        );

        return abi.encode(timestamp, flowRate);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, // _agreementData
        bytes calldata cbdata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        if (!_isPairToken(_superToken) || !_isCFAv1(_agreementClass))
            return _ctx;
        return terminate(_ctx);
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

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return ISuperAgreement(agreementClass).agreementType() == CFA_ID;
    }

    function _isPairToken(ISuperToken superToken) private view returns (bool) {
        return
            address(superToken) == address(token0) ||
            address(superToken) == address(token1);
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isPairToken(superToken), 'SwirlPool: not accepted token');
        require(_isCFAv1(agreementClass), 'SwirlPool: only CFAv1 supported');
        _;
    }

    /**************************************************************************
     * Modifiers
     *************************************************************************/

    modifier onlyswirlToken() {
        require(
            msg.sender == address(swirlToken0) ||
                msg.sender == address(swirlToken1),
            'SwirlPool: only swirl tokens'
        );
        _;
    }

    modifier onlyHost() {
        require(
            msg.sender == address(host),
            'SwirlPool: support only one host'
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
