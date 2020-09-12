//SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/** @title Decentramall SPACE token
 * @notice SPACE follows an ERC721 implementation
 * @dev Only one address can hold one SPACE token as the tokenID is a hash of the buyer's address
 */
contract Decentramall is ERC721 {
    //Max limit of tokens to be minted
    uint256 public _currentLimit;

    //Base price to start
    uint256 public _basePrice;

    //TEMPORARY Multiplier to get price in 10 Finney
    uint256 public _multiplier = 10000000000000000;

    //Holds current detals about the SPACE
    struct SpaceDetails {
        address rightfulOwner;
        address rentedTo;
        uint256 rentalEarned;
        uint256 expiryBlock;
    }

    //Mapping of tokenId to SpaceDetails
    mapping(uint256 => SpaceDetails) public spaceInfo;

    event SetLimit(uint256 limit);
    event Withdraw(address indexed to, uint256 amount);
    event BuyToken(address indexed buyer, uint256 price, uint256 tokenId);
    event Received(address indexed sender, uint256 value);

    event Deposit(address indexed from, uint256 tokenId);
    event Rented(address indexed renter, uint256 tokenId, uint256 rentPrice);
    event ClaimRent(address indexed owner, uint256 amount, uint256 toClaim);
    event Withdraw(address indexed to, uint256 tokenId);

    constructor(uint256 currentLimit, uint256 basePrice)
        public
        ERC721("Decentramall Space Token", "SPACE")
    {
        _currentLimit = currentLimit;
        _basePrice = basePrice;
    }

    /**
     * @dev Withdraw funds from this contract
     * @param to address to withdraw to
     * @param amount the amount to withdraw
     * @notice TODO: Make it multisig so not one admin can withdraw all
     */
    function withdraw(address payable to, uint256 amount) external onlyAdmin {
        require(balance() > 0 && amount < balance(), "Impossible");
        to.transfer(amount);
        emit Withdraw(to, amount);
    }

    /**
     * @dev Change the currentLimit variable (Max supply)
     * @param limit the current token minting limit
     * Only admin(s) can change this variable
     */
    function setLimit(uint256 limit) public onlyAdmin {
        _currentLimit = limit;
        emit SetLimit(limit);
    }

    /**
     * @dev Get price of next token
     * @param x the x value in the bonding curve graph
     * Assuming current bonding curve function of y = x^2 + basePrice
     * @return price at the specific position in bonding curve
     */
    function price(uint256 x) public view returns (uint256) {
        return ((x**2) + _basePrice);
    }

    /**
     * @dev Buy a unique token
     *
     * One address can only hold one token as the token ID is based on a hashed version of the buyer's address
     *
     * The price of the token is based on a bonding curve function
     */
    function buy() public payable {
        require(totalSupply() < _currentLimit, "Max supply reached!");
        uint256 supplyBefore = totalSupply();
        uint256 quotedPrice = price(supplyBefore + 1) * _multiplier;

        require(
            msg.value >= (quotedPrice * 1 wei),
            "Not enough funds to purchase token!"
        );
        uint256 tokenId = _mint(msg.sender);

        require(totalSupply() > supplyBefore, "Token did not mint!");
        emit BuyToken(msg.sender, quotedPrice, tokenId);
    }

    /**
     * @dev Sell a unique token
     *
     * Sell and burn the token that has been minted
     * @param tokenId the ID of the token being sold
     * - The price of the token is based on a bonding curve function
     * - Will check if token is legitimate
     */
    function sell(uint256 tokenId) public {
        require(
            _exists(tokenId) && ownerOf(tokenId) == msg.sender == true,
            "Fake token!"
        );
        uint256 supplyBefore = totalSupply();
        uint256 quotedPrice = price(supplyBefore) * _multiplier;

        require(quotedPrice <= balance(), "Price can't be higher than balance");
        _burn(tokenId);

        require(totalSupply() < supplyBefore, "Token did not burn");
        address payable seller = msg.sender;
        seller.transfer(quotedPrice * 1 wei);
        emit SellToken(msg.sender, quotedPrice, tokenId);
    }

    // not safe, I know!
    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
    * @dev Deposit the SPACE token to this contract
    * @param tokenId ID of the token to check
    * @notice need to write an approve method
    **/
    function deposit(uint256 tokenId) public {
        require(verifyLegitimacy(msg.sender, tokenId) == true, "Fake token!");
        transferFrom(msg.sender, address(this), tokenId);

        //Register the rightful owner if first time user
        if(spaceInfo[tokenId].rightfulOwner == address(0)){
            spaceInfo[tokenId] = SpaceDetails(msg.sender, msg.sender, 0, 0);
        }
        emit Deposit(msg.sender, tokenId);
    }

    /**
    * @dev Withdraw the SPACE token from this contract
    * @param tokenId ID of the token to check
    * @notice this will withdraw both the rental earned and the SPACE token
    **/
    function withdrawSpace(uint256 tokenId) public {
        require(
            spaceInfo[tokenId].expiryBlock < block.number &&
            spaceInfo[tokenId].rightfulOwner == msg.sender, "Token is rented / Not owner!"
        );
        claimRent(msg.sender, tokenId);
        _safeTransfer(address(this), msg.sender, tokenId);
    }

    /**
    * @dev Allows users to rent a SPACE token of choice
    * @param tokenId ID of the token to check
    * @notice rent per year cost 1/10 of the price to buy new & lasts for 1 month (187714 blocks)
    **/
    function rent(uint256 tokenId, string memory _tokenURI) public payable{
        require(spaceInfo[tokenId].expiryBlock < block.number, "Token is already rented!");
        uint256 priceFinney = price(totalSupply()+1) * _multiplier;
        uint256 rentPrice = priceFinney / 120; //In wei
        require(msg.value >= (rentPrice * 1 wei), "Not enough funds!");
        spaceInfo[tokenId].rentedTo = msg.sender;
        spaceInfo[tokenId].rentalEarned += rentPrice;
        spaceInfo[tokenId].expiryBlock = block.number + 187714;
       _setTokenURI(tokenId, _tokenURI);
        emit Rented(msg.sender, tokenId, rentPrice);
    }

    /**
    * @dev Claim the rent earned
    * @param tokenId id of the SPACE token
    * @notice Owner can claim rent right on Day 1 of renting
    **/
    function claimRent(address payable owner, uint256 tokenId) public {
        require(spaceInfo[tokenId].rightfulOwner == owner, "Not owner!");
        uint256 toClaim = spaceInfo[tokenId].rentalEarned;
        require(balance() >= toClaim, "Not enough funds to pay!");
        spaceInfo[tokenId].rentalEarned -= toClaim;
        owner.transfer(toClaim * 1 wei);
        emit ClaimRent(owner, tokenId, toClaim);
    }

    /**
    * @dev Check who has the rights to use the token currently
    * @param tokenId ID of the token to check
    * @return the address of who can use the SPACE
    **/
    function checkDelegatedOwner(uint256 tokenId) public view returns (address) {
        //Check if the token is being rented
        if(spaceInfo[tokenId].expiryBlock >= block.number){
            //Since rented, the current owner (have the right to use the SPACE) is the renter
            return spaceInfo[tokenId].rentedTo;
        } else {
            //Token is not rented, it either exists in this contract, or is held by the owner
            address currentOwner = ownerOf(tokenId);
            if(currentOwner == address(this)){
                //Token is here! Time to check spaceInfo
                return spaceInfo[tokenId].rightfulOwner;
            } else {
                return currentOwner;
            }
        }
    }
}
