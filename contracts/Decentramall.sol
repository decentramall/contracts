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

    // DAI contract address
    address public dai;

    struct SpaceDetails {
        address renter; // The address who rent
        uint256 rentalEarned; // The amount earnt
        uint256 expiryBlock; // The block the rent expires
        bool isRentable; // Can be rented
        bool isValid; // True if purchased & not sold
    }

    //Mapping of tokenId to SpaceDetails
    mapping(address => SpaceDetails) public spaceInfo;

    modifier isOwner(address caller){
        require(spaceInfo[caller].isValid == true);
        _;
    }

    event BuySpace(address buyer, uint256 tokenId, uint256 price);
    event SellSpace(address seller, uint256 tokenId, uint256 price);
    event DepositSpace(address depositor, uint256 tokenId);
    event WithdrawSpace(address withdrawer, uint256 tokenId);
    event RentSpace(address renter, uint256 tokenId, uint256 expiryBlock, uint256 rentPaid);
    event ClaimRent(address owner, uint256 tokenId, uint256 rentClaimed);

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
     * @param x the position on the curve to check
     * Assuming current bonding curve function of 
     * y = maxPrice/2(( x - midpoint )/sqrt(steepness + (x - midpoint)^2) + 1)
     * In other words, a Sigmoid function
     * Note that we divide back by 10^30 because 10^24 * 10^24 = 10^48 and most ERC20 is in 10^18
     * @return price at the specific position in bonding curve
     */
    function price(uint256 x) public view returns(uint256){
        int256 numerator = int256(x) - midpoint;
        int256 innerSqrt = (steepness + (numerator)**2);
        int256 fixedInner = innerSqrt.toFixed();
        int256 fixedDenominator = fixedInner.sqrt();
        int256 fixedNumerator = numerator.toFixed();
        int256 midVal = fixedNumerator.divide(fixedDenominator) + 1000000000000000000000000;
        int256 fixedFinal = maxPrice.toFixed() * midVal;
        return uint256(fixedFinal / 1000000000000000000000000000000);
    }

    /**
     * @dev Buy SPACE
     */
    function buy() public {
        uint256 currentSupply = totalSupply();
        uint256 estimatedPrice = price(currentSupply + 1);

        require(currentSupply < uint256(currentLimit), "Max Supply Reached!");

        IERC20(dai).transferFrom(msg.sender, address(this), estimatedPrice);
        uint256 tokenId = uint256(keccak256(abi.encodePacked(msg.sender)));
        _mint(msg.sender, tokenId);
        emit BuySpace(msg.sender, tokenId, estimatedPrice);
    }

    /**
     * @dev Sell SPACE
     */
    function sell(uint256 tokenId) public{
        require(ownerOf(tokenId) == msg.sender, "Fake token!");
        uint256 quotedPrice = price(totalSupply());

        _burn(tokenId);
        IERC20(dai).transfer(msg.sender, quotedPrice);
        emit SellSpace(msg.sender, tokenId, quotedPrice);
    }

    /**
     * @dev Deposit SPACE to be rented out
     */
    function deposit(uint256 tokenId) public {
        transferFrom(msg.sender, address(this), tokenId);
        spaceInfo[msg.sender].isRentable = true;
    }

    /**
     * @dev Rent SPACE
     */
    function rent(uint256 tokenId) public{
        
    }

    /**
     * @dev Claim the rent earned
     * @param tokenId id of the SPACE token
     * @notice Owner can claim rent right on Day 1 of renting
     **/
    function claim(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner!");
        uint256 toClaim = spaceInfo[msg.sender].rentalEarned;
        IERC20(dai).transfer(msg.sender, toClaim);
        spaceInfo[msg.sender].rentalEarned -= toClaim;
        emit ClaimRent(msg.sender, tokenId, toClaim);
    }

    /**
     * @dev Withdraw space
     * @param tokenId id of the SPACE token
     * @notice Withdrawing also claims rent
     **/
    function withdraw(uint256 tokenId) public{
        require(ownerOf(tokenId) == msg.sender, "Fake token!");
        uint256 quotedPrice = price(totalSupply());

        _burn(tokenId);
        IERC20(dai).transfer(msg.sender, quotedPrice);
        emit SellSpace(msg.sender, tokenId, quotedPrice);
    }
}