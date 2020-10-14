//SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import './Decentramall.sol';

/** @title Decentramall SPACE token
 * @notice This contract will house the renting, registry and buying of SPACE
 */

contract DecentramallRegistry {
    // DAI contract address
    address public dai;
    //Multiplier to get price in 18 decimals
    uint256 public multiplier = 1000000000000000000;

    struct SpaceDetails {
        address owner;
        address renter;
        uint256 rentalEarned;
        uint256 expiryBlock;
    }

    function price() public {

    }

    function buy() public {

    }
}