// SPDX-License-Identifier: AGPLv3
pragma solidity 0.8.13;

import {IFlowToken} from "./interfaces/IFlowToken.sol";
import {IFlowSwap} from "./interfaces/IFlowSwap.sol";

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract FlowToken is IFlowToken {
    bytes32 private constant _REWARD_ADDRESS_CONFIG_KEY = keccak256("org.superfluid-finance.superfluid.rewardAddress");

    using SafeCast for uint256;
    using SafeCast for int256;

    /// @dev Superfluid contract
    IFlowSwap internal _host;

    /// @dev Settled balance for the account
    mapping(address => int256) internal _balances;

    /// @dev Total supply
    uint256 internal _totalSupply;

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

    function setHost(IFlowSwap host) internal {
        _host = host;
    }

    /// @dev ISuperfluidToken.getHost implementation
    function getHost() external view override(IFlowToken) returns (address host) {
        return address(_host);
    }

    /**************************************************************************
     * Real-time balance functions
     *************************************************************************/

    /// @dev ISuperfluidToken.realtimeBalanceOf implementation
    function realtimeBalanceOf(address account, uint256 timestamp) public view override returns (int256 availableBalance) {
        // availableBalance = _balances[account];
        // ISuperAgreement[] memory activeAgreements = getAccountActiveAgreements(account);
        // for (uint256 i = 0; i < activeAgreements.length; i++) {
        //     (int256 agreementDynamicBalance, uint256 agreementDeposit, uint256 agreementOwedDeposit) = activeAgreements[i]
        //         .realtimeBalanceOf(this, account, timestamp);
        //     deposit = deposit + agreementDeposit;
        //     owedDeposit = owedDeposit + agreementOwedDeposit;
        //     // 1. Available Balance = Dynamic Balance - Max(0, Deposit - OwedDeposit)
        //     // 2. Deposit should not be shared between agreements
        //     availableBalance =
        //         availableBalance +
        //         agreementDynamicBalance -
        //         (agreementDeposit > agreementOwedDeposit ? (agreementDeposit - agreementOwedDeposit) : 0).toInt256();
        // }
        return 1;
    }

    /// @dev ISuperfluidToken.realtimeBalanceOfNow implementation
    function realtimeBalanceOfNow(address account) public view override returns (int256 availableBalance) {
        uint256 timestamp = _host.getNow();
        return 1;
    }

    /**************************************************************************
     * Token implementation helpers
     *************************************************************************/

    function _mint(address account, uint256 amount) internal {
        _balances[account] = _balances[account] + amount.toInt256();
        _totalSupply = _totalSupply + amount;
    }

    function _burn(address account, uint256 amount) internal {
        int256 availableBalance = realtimeBalanceOf(account, _host.getNow());
        require(availableBalance >= amount.toInt256(), "SuperfluidToken: burn amount exceeds balance");
        _balances[account] = _balances[account] - amount.toInt256();
        _totalSupply = _totalSupply - amount;
    }

    function _move(
        address from,
        address to,
        int256 amount
    ) internal {
        int256 availableBalance = realtimeBalanceOf(from, _host.getNow());
        require(availableBalance >= amount, "SuperfluidToken: move amount exceeds balance");
        _balances[from] = _balances[from] - amount;
        _balances[to] = _balances[to] + amount;
    }

    /**************************************************************************
     * Modifiers
     *************************************************************************/

    modifier onlyHost() {
        require(address(_host) == msg.sender, "SuperfluidToken: Only host contract allowed");
        _;
    }
}
