//SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/** @title Decentramall SPACE token
 * @notice SPACE follows an ERC721 implementation
 * @dev Only one address can hold one SPACE token as the tokenID is a hash of the buyer's address
 */
contract Decentramall is ERC721 {
    //Max limit of tokens to be minted
    uint256 public currentLimit;
    //Base price to start
    uint256 public basePrice;
    //Multiplier to get price in 18 decimals
    uint256 public multiplier = 1000000000000000000;
    // DAI contract address
    address public dai;
}