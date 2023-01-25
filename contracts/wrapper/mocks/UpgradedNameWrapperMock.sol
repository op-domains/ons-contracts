//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "../INameWrapper.sol";
import "../../registry/ONS.sol";
import "../../ethregistrar/IBaseRegistrar.sol";

contract UpgradedNameWrapperMock {
    address public immutable oldNameWrapper;
    ONS public immutable ons;
    IBaseRegistrar public immutable registrar;

    constructor(
        address _oldNameWrapper,
        ONS _ons,
        IBaseRegistrar _registrar
    ) {
        oldNameWrapper = _oldNameWrapper;
        ons = _ons;
        registrar = _registrar;
    }

    event SetSubnodeRecord(
        bytes32 parentNode,
        string label,
        address newOwner,
        address resolver,
        uint64 ttl,
        uint32 fuses,
        uint64 expiry
    );

    event WrapETH2LD(
        string label,
        address wrappedOwner,
        uint32 fuses,
        uint64 expiry,
        address resolver
    );

    function wrapETH2LD(
        string calldata label,
        address wrappedOwner,
        uint32 fuses,
        uint64 expiry,
        address resolver
    ) public {
        uint256 tokenId = uint256(keccak256(bytes(label)));
        address registrant = registrar.ownerOf(tokenId);
        registrar.transferFrom(registrant, address(this), tokenId);
        registrar.reclaim(tokenId, address(this));
        require(
            registrant == msg.sender ||
                registrar.isApprovedForAll(registrant, msg.sender),
            "Unauthorised"
        );
        emit WrapETH2LD(label, wrappedOwner, fuses, expiry, resolver);
    }

    function setSubnodeRecord(
        bytes32 parentNode,
        string memory label,
        address newOwner,
        address resolver,
        uint64 ttl,
        uint32 fuses,
        uint64 expiry
    ) public {
        bytes32 labelhash = keccak256(bytes(label));
        bytes32 node = keccak256(abi.encodePacked(parentNode, labelhash));
        address owner = ons.owner(node);
        require(
            msg.sender == oldNameWrapper ||
                owner == msg.sender ||
                ons.isApprovedForAll(owner, msg.sender),
            "Not owner/approved or previous nameWrapper controller"
        );
        ons.setOwner(node, address(this));
        emit SetSubnodeRecord(
            parentNode,
            label,
            newOwner,
            resolver,
            ttl,
            fuses,
            expiry
        );
    }
}
