pragma solidity ^0.8.0;
pragma abicoder v2;

import {Lib_AddressResolver} from "@eth-optimism/contracts/libraries/resolver/Lib_AddressResolver.sol";
import {Lib_OVMCodec} from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";
import {Lib_SecureMerkleTrie} from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import {StateCommitmentChain} from "@eth-optimism/contracts/L1/rollup/StateCommitmentChain.sol";
import {Lib_RLPReader} from "@eth-optimism/contracts/libraries/rlp/Lib_RLPReader.sol";
import {Lib_BytesUtils} from "@eth-optimism/contracts/libraries/utils/Lib_BytesUtils.sol";

struct L2StateProof {
    bytes32 stateRoot;
    Lib_OVMCodec.ChainBatchHeader stateRootBatchHeader;
    Lib_OVMCodec.ChainInclusionProof stateRootProof;
    bytes stateTrieWitness;
    bytes storageTrieWitness;
}

interface IResolverService {
    function addr(bytes32 node)
        external
        view
        returns (L2StateProof memory proof);
}

contract OptimismResolverStub is Lib_AddressResolver {
    string[] public gateways;
    address public l2resolver;

    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    constructor(
        address ovmAddressManager,
        string[] memory _gateways,
        address _l2resolver
    ) Lib_AddressResolver(ovmAddressManager) {
        gateways = _gateways;
        l2resolver = _l2resolver;
    }

    function getl2Resolver() external view returns (address) {
        return l2resolver;
    }

    function addr(bytes32 node) public view returns (address) {
        return _addr(node, OptimismResolverStub.addrWithProof.selector);
    }

    function addr(bytes32 node, uint256 coinType)
        public
        view
        returns (bytes memory)
    {
        if (coinType == 60) {
            return
                addressToBytes(
                    _addr(
                        node,
                        OptimismResolverStub.bytesAddrWithProof.selector
                    )
                );
        } else {
            return addressToBytes(address(0));
        }
    }

    function _addr(bytes32 node, bytes4 selector)
        private
        view
        returns (address)
    {
        bytes memory callData = abi.encodeWithSelector(
            IResolverService.addr.selector,
            node
        );
        revert OffchainLookup(
            address(this),
            gateways,
            callData,
            selector,
            abi.encode(node)
        );
    }

    function addrWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (address)
    {
        return _addrWithProof(response, extraData);
    }

    function bytesAddrWithProof(
        bytes calldata response,
        bytes calldata extraData
    ) external view returns (bytes memory) {
        return addressToBytes(_addrWithProof(response, extraData));
    }

    function _addrWithProof(bytes calldata response, bytes calldata extraData)
        internal
        view
        returns (address)
    {
        L2StateProof memory proof = abi.decode(response, (L2StateProof));
        bytes32 node = abi.decode(extraData, (bytes32));
        require(verifyStateRootProof(proof), "Invalid state root");
        bytes32 slot = keccak256(abi.encodePacked(node, uint256(1)));
        bytes32 value = getStorageValue(l2resolver, slot, proof);
        return address(uint160(uint256(value)));
    }

    function verifyStateRootProof(L2StateProof memory proof)
        internal
        view
        returns (bool)
    {
        StateCommitmentChain ovmStateCommitmentChain = StateCommitmentChain(
            resolve("StateCommitmentChain")
        );
        return
            ovmStateCommitmentChain.verifyStateCommitment(
                proof.stateRoot,
                proof.stateRootBatchHeader,
                proof.stateRootProof
            );
    }

    function getStorageValue(
        address target,
        bytes32 slot,
        L2StateProof memory proof
    ) internal view returns (bytes32) {
        (
            bool exists,
            bytes memory encodedResolverAccount
        ) = Lib_SecureMerkleTrie.get(
                abi.encodePacked(target),
                proof.stateTrieWitness,
                proof.stateRoot
            );
        require(exists, "Account does not exist");
        Lib_OVMCodec.EVMAccount memory account = Lib_OVMCodec.decodeEVMAccount(
            encodedResolverAccount
        );
        (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie
            .get(
                abi.encodePacked(slot),
                proof.storageTrieWitness,
                account.storageRoot
            );
        require(storageExists, "Storage value does not exist");
        return toBytes32PadLeft(Lib_RLPReader.readBytes(retrievedValue));
    }

    // Ported old function from Lib_BytesUtils.sol
    function toBytes32PadLeft(bytes memory _bytes)
        internal
        pure
        returns (bytes32)
    {
        bytes32 ret;
        uint256 len = _bytes.length <= 32 ? _bytes.length : 32;
        assembly {
            ret := shr(mul(sub(32, len), 8), mload(add(_bytes, 32)))
        }
        return ret;
    }

    function addressToBytes(address a) internal pure returns (bytes memory b) {
        b = new bytes(20);
        assembly {
            mstore(add(b, 32), mul(a, exp(256, 12)))
        }
    }
}
