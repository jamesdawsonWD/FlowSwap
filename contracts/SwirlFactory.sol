// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import {Clones} from '@openzeppelin/contracts/proxy/Clones.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/ISwirlFactory.sol';
import './interfaces/ISwirlPool.sol';
import './interfaces/ISwirlPoolERC20.sol';
import {ISwirlPoolToken} from './interfaces/ISwirlPoolToken.sol';
import {ISuperToken, ISuperfluid, SuperAppDefinitions} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol';
import {ISuperApp} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperApp.sol';

contract SwirlFactory is Ownable, ISwirlFactory {
    address[] public override allPairs;
    address public swirlPoolAddress;
    address public swirlTokenProxy;
    address public swirlPoolERC20;
    address public override feeTo;
    address public override feeToSetter;
    address public override migrator;
    ISuperfluid public host;
    mapping(address => mapping(address => address)) public override getPair;

    uint256 private configWord =
        SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

    function initialize(
        ISuperfluid _host,
        address _SwirlPoolERC20,
        address _SwirlPoolAddress,
        address _swirlTokenProxy
    ) public onlyOwner {
        host = _host;
        swirlPoolERC20 = _SwirlPoolERC20;
        swirlPoolAddress = _SwirlPoolAddress;
        swirlTokenProxy = _swirlTokenProxy;
    }

    function setSwirlPoolAddress(address _SwirlPoolAddress) public onlyOwner {
        swirlPoolAddress = _SwirlPoolAddress;
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
        address _swirlToken0 = Clones.clone(swirlTokenProxy);
        address _swirlToken1 = Clones.clone(swirlTokenProxy);
        address _SwirlPoolERC20 = Clones.clone(swirlPoolERC20);

        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        pair = Clones.cloneDeterministic(swirlPoolAddress, salt);

        ISuperToken _token0 = ISuperToken(token0);
        ISuperToken _token1 = ISuperToken(token1);

        ISwirlPoolERC20(_SwirlPoolERC20).initialize(pair);

        ISwirlPoolToken(_swirlToken0).initialize(
            _token0,
            _token0.decimals(),
            _token0.name(),
            _token0.symbol(),
            pair
        );
        ISwirlPoolToken(_swirlToken1).initialize(
            _token1,
            _token1.decimals(),
            _token1.name(),
            _token1.symbol(),
            pair
        );
        host.registerAppByFactory(ISuperApp(pair), configWord);

        ISwirlPool.InitParams memory params = ISwirlPool.InitParams({
            host: host,
            lp: _SwirlPoolERC20,
            underlyingToken0: token0,
            underlyingToken1: token1,
            swirlToken0: _swirlToken0,
            swirlToken1: _swirlToken1
        });
        ISwirlPool(pair).initialize(params);

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
