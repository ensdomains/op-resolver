pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
uint256 constant COIN_TYPE_ETH = 60;

contract OptimismResolver is Ownable {
    mapping(bytes32 => address) addresses;
    mapping(bytes32 => mapping(uint256 => bytes)) _addresses;

    event AddrChanged(bytes32 indexed node, address a);

    function setAddr(
        bytes32 node,
        uint256 coinType,
        bytes memory a
    ) public onlyOwner {
        _addresses[node][coinType] = a;
        emit AddrChanged(node, bytesToAddress(a));
    }

    function addr(bytes32 node) public view returns (bytes memory) {
        return _addresses[node][COIN_TYPE_ETH];
    }

    function addr(bytes32 node, uint256 coinType)
        public
        view
        returns (bytes memory)
    {
        return _addresses[node][coinType];
    }

    function bytesToAddress(bytes memory b)
        internal
        pure
        returns (address payable a)
    {
        require(b.length == 20);
        assembly {
            a := div(mload(add(b, 32)), exp(256, 12))
        }
    }

    function addressToBytes(address a) internal pure returns (bytes memory b) {
        b = new bytes(20);
        assembly {
            mstore(add(b, 32), mul(a, exp(256, 12)))
        }
    }
}
