//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { FixidityLib } from "./FixidityLib.sol";

/** @title Decentramall SPACE token
 * @notice SPACE follows an ERC721 implementation
 * @dev Only one address can hold one SPACE token as the tokenID is a hash of the buyer's address
 */
contract Decentramall is ERC721 {
    using FixidityLib for int256;

    //Max limit of tokens to be minted
    int256 public currentLimit;
    //Midpoint for price function
    int256 public midpoint;
    //Half of max price 
    int256 public maxPrice;
    //Steepness
    int256 public steepness;
    //Multiplier to get price in 18 decimals
    int256 public multiplier = 1000000000000000000;
    // DAI contract address
    address public dai;
    // Registry contract address
    address public registry;

    modifier onlyRegistry(address caller) {
        require(caller == registry);
        _;
    }

    constructor(
        int256 _currentLimit,
        int256 _maxPrice,
        int256 _steepness,
        address _dai
    ) public ERC721("SPACE", "SPACE") {
        currentLimit = _currentLimit;
        maxPrice = _maxPrice;
        midpoint = currentLimit/2;
        steepness = _steepness;
        dai = _dai;
    }

    /**
     * @dev Get price of next token
     * @param x the x value in the bonding curve graph
     * Assuming current bonding curve function of 
     * y = maxPrice/2(( x - midpoint )/sqrt(steepness + (x - midpoint)^2) + 1)
     * In other words, a Sigmoid function
     * @return price at the specific position in bonding curve
     */
    function price() public returns(int256 price){
        int256 numerator = int256(totalSupply()) - midpoint;
        int256 innerSqrt = (steepness + (numerator)**2);
        int256 denominator = Fix;
    }

    function mint(address buyer) onlyRegistry(msg.sender){

    }
}