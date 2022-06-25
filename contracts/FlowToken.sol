// SPDX-License-Identifier: AGPLv3
pragma solidity 0.8.13;

import {IFlowToken} from './interfaces/IFlowToken.sol';
import {IFlowSwap} from './interfaces/IFlowSwap.sol';
import {ISuperToken} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol';
import {UQ112x112} from './libraries/UQ112x112.sol';

import {SafeCast} from '@openzeppelin/contracts/utils/math/SafeCast.sol';
import '@uniswap/lib/contracts/libraries/FixedPoint.sol';

abstract contract FlowToken is IFlowToken {
    bytes32 private constant _REWARD_ADDRESS_CONFIG_KEY =
        keccak256('org.superfluid-finance.superfluid.rewardAddress');

    using SafeCast for uint256;
    using SafeCast for int256;
    using UQ112x112 for uint224;
    using FixedPoint for FixedPoint.uq112x112;
    /// @dev Superfluid contract
    IFlowSwap internal _host;

    /// @dev Settled balance for the account
    mapping(address => uint256) internal _balances;

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
        override(IFlowToken)
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
        uint256 flowrate,
        uint32 start,
        uint32 end,
        uint256 priceCumulativeStart,
        uint256 priceCumulativeLast
    ) public view returns (uint256 amount) {
        uint256 timeElapsed = (end - start);
        uint256 totalFlowed = flowrate * timeElapsed;
        FixedPoint.uq112x112 memory averagePrice = FixedPoint.uq112x112(
            uint224((priceCumulativeLast - priceCumulativeStart) / timeElapsed)
        );
        amount = averagePrice.mul(totalFlowed).decode144();
    }

    /// @dev ISuperfluidToken.realtimeBalanceOf implementation
    function realtimeBalanceOf(
        address account,
        uint32 timestamp,
        uint256 priceCumulativeLast
    ) public view override returns (uint256 availableBalance) {
        availableBalance = _balances[account];
        IFlowSwap.Reciept memory reciept = _host.swapOf(account);
        if (reciept.flowRate > 0 && reciept.from != getUnderlyingToken()) {
            availableBalance =
                availableBalance +
                conversion(
                    uint256(reciept.flowRate),
                    reciept.executed,
                    timestamp,
                    reciept.priceCumulativeStart,
                    priceCumulativeLast
                );
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
            ? _host.price0CumulativeLast()
            : _host.price1CumulativeLast();
        availableBalance = realtimeBalanceOf(
            account,
            timestamp,
            priceCumulativeLast
        );
    }

    function settleBalance(address account)
        external
        override
        onlyHost
        returns (uint256)
    {
        _balances[account] = realtimeBalanceOfNow(account);
    }

    /**************************************************************************
     * Token implementation helpers
     *************************************************************************/

    function _mint(address account, uint256 amount) internal {
        _balances[account] = _balances[account] + amount;
        _totalSupply = _totalSupply + amount;
    }

    function _burn(address account, uint256 amount) internal {
        uint256 availableBalance = realtimeBalanceOf(
            account,
            _host.blockTimestampLast(),
            _host.getPriceCumulativeLast(getUnderlyingToken())
        );
        require(
            availableBalance >= amount,
            'SuperfluidToken: burn amount exceeds balance'
        );
        _balances[account] = _balances[account] - amount;
        _totalSupply = _totalSupply - amount;
    }

    function _move(
        address from,
        address to,
        uint256 amount
    ) internal {
        uint256 availableBalance = realtimeBalanceOf(
            from,
            _host.blockTimestampLast(),
            _host.getPriceCumulativeLast(getUnderlyingToken())
        );
        require(
            availableBalance >= amount,
            'SuperfluidToken: move amount exceeds balance'
        );
        _balances[from] = _balances[from] - amount;
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
