// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import {Clones} from '@openzeppelin/contracts/proxy/Clones.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/IFlowFactory.sol';
import './interfaces/IFlowSwap.sol';

contract FlowFactory is Ownable, IFlowFactory {
    address public flowSwapAddress;
    address[] public override allPairs;
    address public override feeTo;
    address public override feeToSetter;
    address public override migrator;

    mapping(address => mapping(address => address)) public override getPair;

    constructor(address _flowSwapAddress) {
        flowSwapAddress = _flowSwapAddress;
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
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        pair = Clones.cloneDeterministic(flowSwapAddress, salt);
        IFlowSwap(pair).initialize(token0, token1);
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
