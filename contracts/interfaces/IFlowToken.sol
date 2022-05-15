// SPDX-License-Identifier: AGPLv3
pragma solidity >=0.8.0;

/**
 * @title Superfluid token interface
 * @author Superfluid
 */
interface IFlowToken {
    /**************************************************************************
     * Basic information
     *************************************************************************/

    /**
     * @dev Get superfluid host contract address
     */
    function getHost() external view returns (address host);

    /**************************************************************************
     * Real-time balance functions
     *************************************************************************/

    /**
     * @dev Calculate the real balance of a user, taking in consideration all agreements of the account
     * @param account for the query
     * @param timestamp Time of balance
     * @return availableBalance Real-time balance
     */
    function realtimeBalanceOf(address account, uint256 timestamp) external view returns (int256 availableBalance);

    /**
     * @notice Calculate the realtime balance given the current host.getNow() value
     * @dev realtimeBalanceOf with timestamp equals to block timestamp
     * @param account for the query
     * @return availableBalance Real-time balance
     */
    function realtimeBalanceOfNow(address account) external view returns (int256 availableBalance);
}
