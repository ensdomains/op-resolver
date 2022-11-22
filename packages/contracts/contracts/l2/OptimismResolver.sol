pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
uint256 constant COIN_TYPE_ETH = 60;

contract OptimismResolver is Ownable {
    mapping(bytes32 => mapping(uint256 => bytes32)) _addresses; // 1
    mapping(bytes => bytes32) _bytes; // 2

    event AddrChanged(bytes32 indexed node, address a);

    function setAddr(
        bytes32 node,
        uint256 coinType,
        bytes32 a
    ) public onlyOwner {
        _addresses[node][coinType] = a;
    }

    function addr(bytes32 node) public view returns (bytes32) {
        return _addresses[node][COIN_TYPE_ETH];
    }

    function addr(bytes32 node, uint256 coinType)
        public
        view
        returns (bytes32)
    {
        return _addresses[node][coinType];
    }

    function bytesToAddress(bytes32 b)
        internal
        pure
        returns (address payable a)
    {
        require(b.length == 20);
        assembly {
            a := div(mload(add(b, 32)), exp(256, 12))
        }
    }

    function mapIntLocation(uint256 slot, uint256 key) public pure returns (uint256) {
        return uint256(keccak256(
          abi.encode(key, slot)
        ));
    }

    function mapLocation(bytes32 slot, uint256 key) public pure returns (uint256) {
        return uint256(keccak256(
          abi.encode(key, slot)
        ));
    }

}
