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
        uint256 rentPrice; // The most recent rent price (for cancel function)
        uint256 startBlock; // The block the rent starts
        uint256 expiryBlock; // The block the rent expires
        uint256 maxRentableBlock; // The last block someone can rent until  
    }

    //Mapping of tokenId to SpaceDetails
    mapping(uint256 => SpaceDetails) public spaceInfo;
    //Mapping of address to cooldown block (prevent double renting, rent-buy & repeated rent-cancel-rent)
    mapping(address => uint256) public cooldownByAddress;

    event BuySpace(address buyer, uint256 tokenId, uint256 price);
    event SellSpace(address seller, uint256 tokenId, uint256 price);
    event DepositSpace(address depositor, uint256 tokenId, uint256 maxRentableBlock);
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
     * @notice Cannot buy space if already renter
     */
    function buy() public {
        require(cooldownByAddress[msg.sender] < block.number, "BUY: Can't buy if renter!");
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
     * @notice Disabling the ability to sell other people's SPACE prevents a hacker from selling stolen SPACE
     */
    function sell(uint256 tokenId) public{
        require(ownerOf(tokenId) == msg.sender, "SELL: Not owner!");
        uint256 quotedPrice = price(totalSupply());
        
        _burn(tokenId);
        IERC20(dai).transfer(msg.sender, quotedPrice);
        emit SellSpace(msg.sender, tokenId, quotedPrice);
    }

    /**
     * @dev Deposit SPACE to be rented out
     * @param tokenId id of SPACE token
     * @param stakeDuration length to stake
     * @notice Must ensure that it is your space before you can deposit it. This is to prevent double SPACE hogging
     */
    function deposit(uint256 tokenId, uint256 stakeDuration) public {
        require(uint256(keccak256(abi.encodePacked(msg.sender))) == tokenId, "DEPOSIT: Not owner!");
        // require(stakeDuration >= 375428, "DEPOSIT: Stake duration has to be more than 375428 blocks!");
        require(stakeDuration >= 375, "DEPOSIT: Stake duration has to be more than 375428 blocks!"); // For testing
        transferFrom(msg.sender, address(this), tokenId);
        uint256 _maxRentableBlock = block.number + stakeDuration;
        spaceInfo[tokenId].maxRentableBlock = _maxRentableBlock;
        emit DepositSpace(msg.sender, tokenId, _maxRentableBlock);
    }

    /**
     * @dev Rent SPACE
     * @param tokenId id of the SPACE token
     * @param _tokenURI unique id for the store
     * @param rentDuration duration for rent
     * @notice The SPACE must be rentable, which means it must exist in this contract, msg.sender does not own a space token,
     * expiryBlock < block.number, cooldown < block.number, at least 1 month & rentDuration < maxRentableBlock
     * @notice Rent per year cost 1/10 of the price to buy new & lasts for 1 month (187714 blocks)
     */
    function rent(uint256 tokenId, string memory _tokenURI, uint256 rentDuration) public {
        require(ownerOf(tokenId) == address(this), "RENT: Doesn't exist!");
        require(cooldownByAddress[msg.sender] < block.number, "RENT: Cooldown active!");
        // require(rentDuration >= 187714, "RENT: Rent duration has to be more than 187714 blocks!");
        require(rentDuration >= 187, "RENT: Rent duration has to be more than 187714 blocks!"); // For testing
        require(spaceInfo[tokenId].expiryBlock < block.number, "RENT: Token is already rented!");

        uint256 rentUntil = block.number + rentDuration;
        require(rentUntil <= spaceInfo[tokenId].maxRentableBlock, "RENT: Rent duration exceed maxRentableBlock!");

        // This is gonna be big ouch for SPACE traders
        for(uint i=0; i<balanceOf(msg.sender); i++){
            require(ownerOf(uint256(keccak256(abi.encodePacked(msg.sender)))) != msg.sender, "RENT: Can't rent if address owns SPACE token");
        }
        
        // Finding price
        uint256 actualPrice = price(totalSupply() + 1);
        // uint256 rentPrice = (actualPrice / 10) * (rentDuration/2252571); 
        uint256 rentPrice = 2207252791264252534; // For testing

        // Make rent payment
        IERC20(dai).transferFrom(msg.sender, address(this), rentPrice);
        uint256 newExpBlock = block.number + rentDuration;

        // Change struct values
        spaceInfo[tokenId].rentedTo = msg.sender;
        spaceInfo[tokenId].rentalEarned += rentPrice;
        spaceInfo[tokenId].rentPrice = rentPrice;
        spaceInfo[tokenId].startBlock = block.number;
        spaceInfo[tokenId].expiryBlock = newExpBlock;
        cooldownByAddress[msg.sender] = newExpBlock;

        _setTokenURI(tokenId, _tokenURI);
        emit RentSpace(msg.sender, tokenId, newExpBlock, rentPrice);
    }

    /**
     * @dev Cancel Rent SPACE
     * @param tokenId id of the SPACE token
     * @notice Forces address to wait two days before renting again
     * @notice Currently refunds 9/10 of initial price & can only be done within first day
     * @notice Requires: token to exist, token to be rented, is renter
     */
    function cancelRent(uint256 tokenId) public {
        require(ownerOf(tokenId) == address(this), "CANCEL: Doesn't exist!");
        require(spaceInfo[tokenId].expiryBlock > block.number, "CANCEL: Token not rented!");
        require(spaceInfo[tokenId].rentedTo == msg.sender, "CANCEL: Not renter!");
        // require(spaceInfo[tokenId].startBlock + 6171 >= block.number, "CANCEL: Can't cancel after 1 day!");
        require(spaceInfo[tokenId].startBlock + 6 >= block.number, "CANCEL: Can't cancel after 1 day!"); // For testing
        
        // Cooldown
        cooldownByAddress[msg.sender] = block.number + 12800; // Roughly two days

        // Refund
        uint256 refund = spaceInfo[tokenId].rentPrice * 9/10;
        spaceInfo[tokenId].rentalEarned -= refund;
        IERC20(dai).transfer(msg.sender, refund);

        // Remove rent status
        spaceInfo[tokenId].rentedTo = address(0); // Safer, prevents accidental issues
        spaceInfo[tokenId].expiryBlock = block.number;
        
        emit CancelRent(msg.sender, tokenId);
    }

    /**
     * @dev Extend Rent SPACE
     * @param tokenId id of the SPACE token
     * @param rentDuration duration of rent extension
     * @notice Rent extensions can't be cancelled, however, can be less than 1 month
     * @notice Requires: token to exist, token to be rented, is renter, rentDuration doesnt exceed maxRentableBlock
     */
    function extendRent(uint256 tokenId, uint256 rentDuration) public {
        require(ownerOf(tokenId) == address(this), "EXTEND: Doesn't exist!");
        require(spaceInfo[tokenId].expiryBlock > block.number, "EXTEND: Token not rented!");
        require(spaceInfo[tokenId].rentedTo == msg.sender, "EXTEND: Not renter!");

        uint256 rentUntil = spaceInfo[tokenId].expiryBlock + rentDuration;
        require(rentUntil <= spaceInfo[tokenId].maxRentableBlock, "EXTEND: Rent duration exceed maxRentableBlock!");

        // Finding price
        uint256 actualPrice = price(totalSupply() + 1);
        uint256 rentPrice = (actualPrice / 10) * (rentDuration/2252); 

        // Make rent payment
        IERC20(dai).transferFrom(msg.sender, address(this), rentPrice);

        // Change struct values
        spaceInfo[tokenId].rentalEarned += rentPrice;
        spaceInfo[tokenId].expiryBlock = rentUntil;
        cooldownByAddress[msg.sender] = rentUntil;

        emit ExtendRent(msg.sender, tokenId, rentUntil, rentPrice);
    }

    /**
     * @dev Claim the rent earned
     * @param tokenId id of the SPACE token
     * @notice Owner can claim rent after 6171 blocks (1 day)
     * @notice Must be actual owner (proof if identity)
     **/
    function claim(uint256 tokenId) public {
        require(ownerOf(tokenId) == address(this), "CLAIM: Doesn't exist!");
        require(uint256(keccak256(abi.encodePacked(msg.sender))) == tokenId, "CLAIM: Not owner!");
        // require(spaceInfo[tokenId].startBlock + 6171 < block.number, "CLAIM: Can't claim before 1 day!");
        require(spaceInfo[tokenId].startBlock + 6 < block.number, "CLAIM: Can't claim before 1 day!"); // For testing

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
     * Lastly, ensure that it is past stake duration
     **/
    function withdraw(uint256 tokenId) public{
        require(ownerOf(tokenId) == address(this), "WITHDRAW: Doesn't exist!");
        require(uint256(keccak256(abi.encodePacked(msg.sender))) == tokenId, "WITHDRAW: Not owner!");
        require(spaceInfo[tokenId].maxRentableBlock < block.number, "WITHDRAW: Token is locked!");

        //Claim rent
        claim(tokenId);

        //Withdraw
        _transfer(address(this), msg.sender, tokenId);
        emit WithdrawSpace(msg.sender, tokenId);
    }
}