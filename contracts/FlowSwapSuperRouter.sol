// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import {IFlowSwap} from './interfaces/IFlowSwap.sol';
import {SuperAppBase} from '@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol';
import {ISuperfluid, SuperAppDefinitions, ISuperToken, ISuperAgreement} from '@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol';

contract FlowSwapSuperRouter is SuperAppBase {
    IFlowSwap public pair;
    bytes32 public constant CFA_ID =
        keccak256('org.superfluid-finance.agreements.ConstantFlowAgreement.v1');

    constructor(ISuperfluid _host, address _pair) {
        pair = IFlowSwap(_pair);

        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            // change from 'before agreement stuff to after agreement
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);
    }

    /**************************************************************************
     * SuperApp Callbacks
     *************************************************************************/

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
        return pair.createFlow(_ctx, _superToken);
    }

    function afterAgreementUpdated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, // _agreementData,
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    )
        external
        override
        onlyExpected(_superToken, _agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        return pair.createFlow(_ctx, _superToken);
    }

    function afterAgreementTerminated(
        ISuperToken _superToken,
        address _agreementClass,
        bytes32, // _agreementId,
        bytes calldata, // _agreementData
        bytes calldata, // _cbdata,
        bytes calldata _ctx
    ) external override onlyHost returns (bytes memory newCtx) {
        if (!_isPairToken(_superToken) || !_isCFAv1(_agreementClass))
            return _ctx;
        return pair.terminate(_ctx, _superToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return ISuperAgreement(agreementClass).agreementType() == CFA_ID;
    }

    function _isPairToken(ISuperToken superToken) private view returns (bool) {
        return
            address(superToken) == address(pair.token0()) ||
            address(superToken) == address(pair.token1());
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isPairToken(superToken), 'FlowSwap: not accepted token');
        require(_isCFAv1(agreementClass), 'FlowSwap: only CFAv1 supported');
        _;
    }
    /**************************************************************************
     * Modifiers
     *************************************************************************/

    modifier onlyHost() {
        require(
            msg.sender == address(pair.getCfa().host),
            'FlowSwap: support only one host'
        );
        _;
    }
}
