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
        address rentedTo; // The address who rent
        uint256 rentalEarned; // The amount earnt
        uint256 expiryBlock; // The block the rent expires
    }

    //Mapping of tokenId to SpaceDetails
    mapping(uint256 => SpaceDetails) public spaceInfo;
    //Mapping of address to cooldown block (prevent double renting & repeated rent,cancel,rent)
    mapping(address => uint256) public cooldownByAddress;

    event BuySpace(address buyer, uint256 tokenId, uint256 price);
    event SellSpace(address seller, uint256 tokenId, uint256 price);
    event DepositSpace(address depositor, uint256 tokenId);
    event WithdrawSpace(address withdrawer, uint256 tokenId);
    event RentSpace(address renter, uint256 tokenId, uint256 expiryBlock, uint256 rentPaid);
    event ClaimRent(address owner, uint256 tokenId, uint256 rentClaimed);
    event ExtendRent(address renter, uint256 tokenId, uint256 newExpiryBlock, uint256 newRentPaid);
    event CancelRent(address renter, uint256 tokenId);

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

        require(currentSupply < uint256(currentLimit), "BUY: Max Supply Reached!");

        IERC20(dai).transferFrom(msg.sender, address(this), estimatedPrice);
        uint256 tokenId = uint256(keccak256(abi.encodePacked(msg.sender)));

        _mint(msg.sender, tokenId);
        emit BuySpace(msg.sender, tokenId, estimatedPrice);
    }

    /**
     * @dev Sell SPACE
     */
    function sell(uint256 tokenId) public{
        require(ownerOf(tokenId) == msg.sender, "WITHDRAW: Not owner!");
        uint256 quotedPrice = price(totalSupply());
        
        _burn(tokenId);
        IERC20(dai).transfer(msg.sender, quotedPrice);
        emit SellSpace(msg.sender, tokenId, quotedPrice);
    }

    /**
     * @dev Deposit SPACE to be rented out
     * @notice Must ensure that it is your space before you can deposit it. This is to prevent double SPACE hogging
     */
    function deposit(uint256 tokenId) public {
        require(uint256(keccak256(abi.encodePacked(msg.sender))) == tokenId, "DEPOSIT: Not owner!");
        transferFrom(msg.sender, address(this), tokenId);
        emit DepositSpace(msg.sender, tokenId);
    }

    /**
     * @dev Rent SPACE
     * @param tokenId id of the SPACE token
     * @param _tokenURI unique id for the store
     * @notice The SPACE must be rentable, which means it must exist in this contract, msg.sender does not own a space token,
     * expiryBlock < block.number
     * @notice Rent per year cost 1/10 of the price to buy new & lasts for 1 month (187714 blocks)
     */
    function rent(uint256 tokenId, string memory _tokenURI) public {
        require(ownerOf(tokenId) == address(this), "RENT: Doesn't exist!");
        require(spaceInfo[tokenId].expiryBlock < block.number, "RENT: Token is already rented!");

        // This is gonna be big ouch for SPACE traders
        for(uint i=0; i<balanceOf(msg.sender); i++){
            require(ownerOf(uint256(keccak256(abi.encodePacked(msg.sender)))) != msg.sender, "RENT: Can't rent if address owns SPACE token");
        }
        
        uint256 actualPrice = price(totalSupply() + 1);
        uint256 rentPrice = actualPrice / 120; //In 18 decimals
        IERC20(dai).transferFrom(msg.sender, address(this), rentPrice);
        uint256 newExpBlock = block.number + 187714;

        spaceInfo[tokenId].rentedTo = msg.sender;
        spaceInfo[tokenId].rentalEarned = rentPrice;
        spaceInfo[tokenId].expiryBlock = newExpBlock;

        _setTokenURI(tokenId, _tokenURI);
        emit RentSpace(msg.sender, tokenId, newExpBlock, rentPrice);
    }

    /**
     * @dev Claim the rent earned
     * @param tokenId id of the SPACE token
     * @notice Owner can claim rent right on Day 1 of renting
     * @notice Must be actual owner (proof if identity)
     **/
    function claim(uint256 tokenId) public {
        require(ownerOf(tokenId) == address(this), "CLAIM: Doesn't exist!");
        require(uint256(keccak256(abi.encodePacked(msg.sender))) == tokenId, "CLAIM: Not owner!");

        uint256 toClaim = spaceInfo[tokenId].rentalEarned;
        spaceInfo[tokenId].rentalEarned -= toClaim;

        IERC20(dai).transfer(msg.sender, toClaim);
        emit ClaimRent(msg.sender, tokenId, toClaim);
    }

    /**
     * @dev Withdraw space
     * @param tokenId id of the SPACE token
     * @notice Withdrawing also claims rent
     * @notice We need to check for a few things.
     * First, does this token exist in this contract
     * Then, is the hash of the owner's address equal to that tokenID (proof of identity)
     * Lastly, ensure that it is not currently being rented
     **/
    function withdraw(uint256 tokenId) public{
        require(ownerOf(tokenId) == address(this), "WITHDRAW: Doesn't exist!");
        require(uint256(keccak256(abi.encodePacked(msg.sender))) == tokenId, "WITHDRAW: Not owner!");
        require(spaceInfo[tokenId].expiryBlock < block.number, "WITHDRAW: Token is being rented!");

        //Claim rent
        claim(tokenId);

        //Withdraw
        _transfer(address(this), msg.sender, tokenId);
        emit WithdrawSpace(msg.sender, tokenId);
    }
}