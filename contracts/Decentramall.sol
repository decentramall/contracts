//SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { FixedMath } from "./FixedMath.sol";

/** @title Decentramall SPACE token
 * @notice SPACE follows an ERC721 implementation
 * @dev Only one address can hold one SPACE token as the tokenID is a hash of the buyer's address
 */
contract Decentramall is ERC721 {
    using FixedMath for int256;

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
     * Assuming current bonding curve function of 
     * y = maxPrice/2(( x - midpoint )/sqrt(steepness + (x - midpoint)^2) + 1)
     * In other words, a Sigmoid function
     * Note that we divide back by 10^30 because 10^24 * 10^24 = 10^48 and most ERC20 is in 10^18
     * @return price at the specific position in bonding curve
     */
    function price(int256 x) public view returns(int256){
        int256 numerator = int256(totalSupply()) - midpoint;
        int256 innerSqrt = (steepness + (numerator)**2);
        int256 fixedInner = innerSqrt.toFixed();
        int256 fixedDenominator = fixedInner.sqrt();
        int256 fixedNumerator = numerator.toFixed();
        int256 midVal = fixedNumerator.divide(fixedDenominator) + 1000000000000000000000000;
        int256 fixedFinal = maxPrice.toFixed() * midVal;
        return (fixedFinal / 1000000000000000000000000000000);
    }

    // function mint(address buyer) public onlyRegistry(msg.sender){
    //     require(buyer == msg.sender);
    // }
}