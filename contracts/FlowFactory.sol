// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import {Clones} from '@openzeppelin/contracts/proxy/Clones.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/IFlowFactory.sol';
import './interfaces/IFlowSwap.sol';
import './interfaces/IFlowSwapERC20.sol';
import {IFlowSwapToken} from './interfaces/IFlowSwapToken.sol';
import {ISuperToken, ISuperfluid} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol';
import './FlowSwapSuperRouter.sol';

contract FlowFactory is Ownable, IFlowFactory {
    address[] public override allPairs;
    address public flowSwapAddress;
    address public flowTokenProxy;
    address public flowSwapERC20;
    address public override feeTo;
    address public override feeToSetter;
    address public override migrator;
    ISuperfluid public host;
    mapping(address => mapping(address => address)) public override getPair;

    constructor(
        ISuperfluid _host,
        address _flowSwapERC20,
        address _flowSwapAddress,
        address _flowTokenProxy
    ) {
        host = _host;
        flowSwapAddress = _flowSwapAddress;
        flowTokenProxy = _flowTokenProxy;
    }

    function setflowSwapAddress(address _flowSwapAddress) public onlyOwner {
        flowSwapAddress = _flowSwapAddress;
    }

    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB)
        external
        override
        returns (address pair)
    {
        require(tokenA != tokenB, 'UniswapV2: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');
        require(
            getPair[token0][token1] == address(0),
            'UniswapV2: PAIR_EXISTS'
        ); // single check is sufficient
        address _flowToken0 = Clones.clone(flowTokenProxy);
        address _flowToken1 = Clones.clone(flowTokenProxy);
        address _flowSwapERC20 = Clones.clone(flowSwapERC20);

        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        pair = Clones.cloneDeterministic(flowSwapAddress, salt);

        ISuperToken _token0 = ISuperToken(token0);
        ISuperToken _token1 = ISuperToken(token1);

        FlowSwapSuperRouter superRouter = new FlowSwapSuperRouter(host, pair);

        IFlowSwapToken(_flowToken0).initialize(
            _token0,
            _token0.decimals(),
            _token0.name(),
            _token0.symbol(),
            pair
        );
        IFlowSwapToken(_flowToken1).initialize(
            _token1,
            _token1.decimals(),
            _token1.name(),
            _token1.symbol(),
            pair
        );
        IFlowSwapERC20(_flowSwapERC20).initialize(pair);

        IFlowSwap.InitParams memory params = IFlowSwap.InitParams({
            host: host,
            lp: _flowSwapERC20,
            underlyingToken0: token0,
            underlyingToken1: token1,
            flowToken0: _flowToken0,
            flowToken1: _flowToken1,
            superRouter: address(superRouter)
        });
        IFlowSwap(pair).initialize(params);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction

        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external override {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setMigrator(address _migrator) external override {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        migrator = _migrator;
    }

    function setFeeToSetter(address _feeToSetter) external override {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
}
