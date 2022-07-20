// SPDX-License-Identifier: AGPLv3
pragma solidity >=0.8.0;

/**
 * @title Superfluid token interface
 * @author Superfluid
 */
interface ISwirlToken {
    /**************************************************************************
     * Basic information
     *************************************************************************/

    /**
     * @dev Get superfluid host contract address
     */
    function getHost() external view returns (address host);

    function getUnderlyingToken() external view returns (address);

    function conversion(
        uint256 flowrate,
        uint32 start,
        uint32 end,
        uint256 priceCumulativeLast,
        uint256 priceCumulativeStart
    ) external view returns (uint256 amount);

    /**************************************************************************
     * Real-time balance functions
     *************************************************************************/

    /**
     * @dev Calculate the real balance of a user, taking in consideration all agreements of the account
     * @param account for the query
     * @param timestamp Time of balance
     * @return availableBalance Real-time balance
     */
    function realtimeBalanceOf(
        address account,
        uint32 timestamp,
        uint256 priceCumulativeLast
    ) external view returns (uint256 availableBalance);


    /**
     * @notice Calculate the realtime balance given the current host.getNow() value
     * @dev realtimeBalanceOf with timestamp equals to block timestamp
     * @param account for the query
     * @return availableBalance Real-time balance
     */
    function realtimeBalanceOfNow(address account)
        external
        view
        returns (uint256 availableBalance);
}
