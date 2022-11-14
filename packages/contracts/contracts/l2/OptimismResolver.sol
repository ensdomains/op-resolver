pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract OptimismResolver is Ownable {
    mapping(bytes32 => address) addresses;

    event AddrChanged(bytes32 indexed node, address a);

    function setAddr(bytes32 node, address addr) public onlyOwner {
        addresses[node] = addr;
        emit AddrChanged(node, addr);
    }

    function addr(bytes32 node) public view returns (address) {
        return addresses[node];
    }

    function addr(bytes32 node, uint256) public view returns (address) {
        return addresses[node];
    }
}
