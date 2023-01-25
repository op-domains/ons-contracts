pragma solidity >=0.8.4;

import "./ONS.sol";
import "./ONSRegistry.sol";

/**
 * The ONS registry contract.
 */
contract ONSRegistryWithFallback is ONSRegistry {
    ONS public old;

    /**
     * @dev Constructs a new ONS registrar.
     */
    constructor(ONS _old) public ONSRegistry() {
        old = _old;
    }

    /**
     * @dev Returns the address of the resolver for the specified node.
     * @param node The specified node.
     * @return address of the resolver.
     */
    function resolver(bytes32 node) public view override returns (address) {
        if (!recordExists(node)) {
            return old.resolver(node);
        }

        return super.resolver(node);
    }

    /**
     * @dev Returns the address that owns the specified node.
     * @param node The specified node.
     * @return address of the owner.
     */
    function owner(bytes32 node) public view override returns (address) {
        if (!recordExists(node)) {
            return old.owner(node);
        }

        return super.owner(node);
    }

    /**
     * @dev Returns the TTL of a node, and any records associated with it.
     * @param node The specified node.
     * @return ttl of the node.
     */
    function ttl(bytes32 node) public view override returns (uint64) {
        if (!recordExists(node)) {
            return old.ttl(node);
        }

        return super.ttl(node);
    }

    function _setOwner(bytes32 node, address owner) internal override {
        address addr = owner;
        if (addr == address(0x0)) {
            addr = address(this);
        }

        super._setOwner(node, addr);
    }
}
