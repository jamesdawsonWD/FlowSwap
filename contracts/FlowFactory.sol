// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import "./FlowSwap.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FlowFactory is Ownable {
    address public flowSwapAddress;
    constructor(address _flowSwapAddress) {
        flowSwapAddress = _flowSwapAddress;
    }
    function setflowSwapAddress(address _flowSwapAddress) public onlyOwner {
        flowSwapAddress = _flowSwapAddress;
    }
    function createFlowSwap(address _underlyingToken0, address _underlyingToken1) public {
        address clone = Clones.clone(flowSwapAddress);
        FlowSwap(clone).initialize(_underlyingToken0, _underlyingToken1);
        emit FlowSwapCreated(clone);
    }
    event FlowSwapCreated(address _flowSwapAddress);
}
