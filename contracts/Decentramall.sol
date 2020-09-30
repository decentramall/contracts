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

    /** Bonding curve variables */
    //Max price
    uint256 public maxPrice = 5000;
    //Inflection point
    uint256 public midpoint = 600;
    //Steepness
    uint256 public steepness = 50000;

    //Multiplier to get price in 18 decimals
    uint256 public multiplier = 1000000000000000000;
    // DAI contract address
    address public dai;


    //Holds current detals about the SPACE
    struct SpaceDetails {
        address rentedTo;
        uint256 rentalEarned;
        uint256 expiryBlock;
    }

    //Mapping of tokenId to SpaceDetails
    mapping(uint256 => SpaceDetails) public spaceInfo;

    // event SetLimit(uint256 limit);
    event BuyToken(address indexed buyer, uint256 price, uint256 tokenId);
    event SellToken(address indexed seller, uint256 price, uint256 tokenId);
    event Received(address indexed sender, uint256 value);

    event Deposit(address indexed from, uint256 tokenId);
    event Rented(address indexed renter, uint256 tokenId, uint256 rentPrice);
    event ClaimRent(address indexed owner, uint256 amount, uint256 toClaim);

    constructor(
        uint256 _currentLimit,
        uint256 _basePrice,
        address _dai
    ) public ERC721("SPACE", "SPACE") {
        currentLimit = _currentLimit;
        basePrice = _basePrice;
        dai = _dai;
    }

    // /**
    //  * @dev Change the currentLimit variable (Max supply)
    //  * @param limit the current token minting limit
    //  * Only admin(s) can change this variable
    //  */
    // function setLimit(uint256 limit) public onlyAdmin {
    //     currentLimit = limit;
    //     emit SetLimit(limit);
    // }

    /**
     * @dev Get price of next token 
     * @param x the x value in the bonding curve graph
     * Assuming current bonding curve function of 
     * y = maxPrice/2(( x - midpoint )/sqrt(steepness + (x - midpoint)^2) + 1)
     * In other words, a Sigmoid function
     * @dev NOTE: Will possibly hardcode sqrt values in the future to save gas fees
     * @dev ANOTHER NOTE: Price is based on the point on the curve, not area!
     * @return price at the specific position in bonding curve
     */
    function price(uint256 x) public view returns (uint256) {
        let numerator =  x - midpoint;
        let denominator = (steepness + (x - midpoint)**2 )**0.5
        return (maxPrice/2 * (numerator/denominator + 1));
    }

    /**
     * @dev Buy a unique token
     * One address can only hold one token as the token ID is based on a hashed version of the buyer's address
     * The price of the token is based on a bonding curve function
     */
    function buy() public {
        require(totalSupply() < currentLimit, "Max supply reached!");
        uint256 quotedPrice = price(totalSupply() + 1) * multiplier;

        IERC20(dai).transferFrom(msg.sender, address(this), quotedPrice);
        uint256 tokenId = uint256(keccak256(abi.encodePacked(msg.sender)));
        _mint(msg.sender, tokenId);

        emit BuyToken(msg.sender, quotedPrice, tokenId);
    }

    /**
     * @dev Sell a unique token
     * Sell and burn the token that has been minted
     * @param tokenId the ID of the token being sold
     * - The price of the token is based on a bonding curve function
     * - Will check if token is legitimate
     */
    function sell(uint256 tokenId) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "Fake token!"
        );
        uint256 quotedPrice = price(totalSupply()) * multiplier;
        IERC20(dai).transfer(msg.sender, quotedPrice);
        _burn(tokenId);
        emit SellToken(msg.sender, quotedPrice, tokenId);
    }

    /**
     * @dev Allows users to rent a SPACE token of choice
     * @param tokenId ID of the token to check
     * @notice rent per year cost 1/10 of the price to buy new & lasts for 1 month (187714 blocks)
     **/
    function rent(uint256 tokenId, string memory _tokenURI) public {
        require(
            spaceInfo[tokenId].expiryBlock < block.number,
            "Token is already rented!"
        );
        uint256 actualPrice = price(totalSupply() + 1) * multiplier;
        uint256 rentPrice = actualPrice / 120; //In 18 decimals
        IERC20(dai).transferFrom(msg.sender, address(this), rentPrice);
        spaceInfo[tokenId].rentedTo = msg.sender;
        spaceInfo[tokenId].rentalEarned = rentPrice;
        spaceInfo[tokenId].expiryBlock = block.number + 187714;
        _setTokenURI(tokenId, _tokenURI);
        emit Rented(msg.sender, tokenId, rentPrice);
    }

    // TODO: add method to extend rent

    // TODO: add method to cancel rent, forcing to wait two days

    /**
     * @dev Claim the rent earned
     * @param tokenId id of the SPACE token
     * @notice Owner can claim rent right on Day 1 of renting
     **/
    function claim(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner!");
        uint256 toClaim = spaceInfo[tokenId].rentalEarned;
        IERC20(dai).transfer(msg.sender, toClaim);
        spaceInfo[tokenId].rentalEarned -= toClaim;
        emit ClaimRent(msg.sender, tokenId, toClaim);
    }
}
