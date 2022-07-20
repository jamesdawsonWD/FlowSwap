// SPDX-License-Identifier: AGPLv3
pragma solidity 0.8.13;

import {ISwirlToken} from './interfaces/ISwirlToken.sol';
import {ISwirlPool} from './interfaces/ISwirlPool.sol';
import {ISuperToken} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol';
// import {UQ112x112} from './libraries/UQ112x112.sol';

import {SafeCast} from '@openzeppelin/contracts/utils/math/SafeCast.sol';
import './libraries/FixedPoint.sol';

abstract contract SwirlToken is ISwirlToken {
    bytes32 private constant _REWARD_ADDRESS_CONFIG_KEY =
        keccak256('org.superfluid-finance.superfluid.rewardAddress');

    using SafeCast for uint256;
    using SafeCast for int256;
    // using UQ112x112 for uint224;
    using FixedPoint for *;
    /// @dev Superfluid contract
    ISwirlPool internal _host;

    /// @dev Settled balance for the account
    mapping(address => uint256) internal _balances;
    mapping(address => uint256) internal _unsettledAmount;

    /// @dev Total supply
    uint256 internal _totalSupply;

    /// @dev The underlying ERC20 token
    ISuperToken internal _underlyingToken;

    // NOTE: for future compatibility, these are reserved solidity slots
    // The sub-class of SuperfluidToken solidity slot will start after _reserve13
    uint256 internal _reserve4;
    uint256 private _reserve5;
    uint256 private _reserve6;
    uint256 private _reserve7;
    uint256 private _reserve8;
    uint256 private _reserve9;
    uint256 private _reserve10;
    uint256 private _reserve11;
    uint256 private _reserve12;
    uint256 internal _reserve13;

    /// @dev ISuperfluidToken.getHost implementation
    function getHost()
        external
        view
        override(ISwirlToken)
        returns (address host)
    {
        return address(_host);
    }

    function getUnderlyingToken() public view override returns (address) {
        return address(_underlyingToken);
    }

    event Test(uint256 priceStart, uint256 priceEnd);

    /**************************************************************************
     * Real-time balance functions
     *************************************************************************/

    function conversion(
        uint256 Swirlrate,
        uint32 start,
        uint32 end,
        uint256 priceCumulativeStart,
        uint256 priceCumulativeLast
    ) public view returns (uint256 amount) {
        uint256 timeElapsed = (end - start);
        uint256 totalSwirled = Swirlrate * timeElapsed;
        FixedPoint.uq112x112 memory averagePrice = FixedPoint.uq112x112(
            uint224((priceCumulativeLast - priceCumulativeStart) / timeElapsed)
        );
        amount = averagePrice.mul(totalSwirled).decode144();
    }

    /// @dev ISuperfluidToken.realtimeBalanceOf implementation
    function realtimeBalanceOf(
        address account,
        uint32 timestamp,
        uint256 priceCumulativeLast
    ) public view override returns (uint256 availableBalance) {
        availableBalance = _balances[account];
        ISwirlPool.Reciept memory reciept = _host.swapOf(account);
        if (reciept.flowRate > 0 && reciept.from != getUnderlyingToken()) {
            availableBalance =
                availableBalance +
                conversion(
                    uint256(reciept.flowRate),
                    reciept.executed,
                    timestamp,
                    reciept.priceCumulativeStart,
                    priceCumulativeLast
                ) -
                _unsettledAmount[account];
        }
    }

    /// @dev ISuperfluidToken.realtimeBalanceOfNow implementation
    function realtimeBalanceOfNow(address account)
        public
        view
        override
        returns (uint256 availableBalance)
    {
        uint32 timestamp = _host.blockTimestampLast();
        uint256 priceCumulativeLast = _underlyingToken == _host.token0()
            ? _host.price1CumulativeLast()
            : _host.price0CumulativeLast();
        availableBalance = realtimeBalanceOf(
            account,
            timestamp,
            priceCumulativeLast
        );
    }

    function settleBalance(address account) internal returns (uint256) {
        uint256 balance = realtimeBalanceOfNow(account);
        if (balance > 0) {
            _unsettledAmount[account] = 0;
            _totalSupply = _totalSupply + balance - _balances[account];
            _balances[account] = balance;
        }
        return _balances[account];
    }

    /**************************************************************************
     * Token implementation helpers
     *************************************************************************/

    function _mint(address account, uint256 amount) internal {
        _balances[account] = _balances[account] + amount;
    }

    function _burn(address account, uint256 amount) internal {
        uint256 availableBalance = realtimeBalanceOfNow(account);

        require(
            availableBalance >= amount,
            'SuperfluidToken: burn amount exceeds balance'
        );

        _unsettledAmount[account] = _unsettledAmount[account] + amount;
    }

    function _move(
        address from,
        address to,
        uint256 amount
    ) internal {
        uint256 availableBalance = realtimeBalanceOfNow(from);
        require(
            availableBalance >= amount,
            'SuperfluidToken: move amount exceeds balance'
        );

        _unsettledAmount[from] = _unsettledAmount[from] + amount;

        _balances[to] = _balances[to] + amount;
    }

    /**************************************************************************
     * Modifiers
     *************************************************************************/

    modifier onlyHost() {
        require(
            address(_host) == msg.sender,
            'SuperfluidToken: Only host contract allowed'
        );
        _;
    }
}
