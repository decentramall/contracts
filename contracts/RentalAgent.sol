// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import './EstateAgent.sol';
import './DecentramallToken.sol';

contract RentalAgent is Administration{

    //TEMPORARY Multiplier to get price in 10 Finney
    uint256 private _multiplier = 10000000000000000;

    //Holds current detals about the SPACE
    struct SpaceDetails {
        address rightfulOwner;
        address rentedTo;
        uint256 rentalEarned;
        uint256 expiryBlock;
    }

    //Mapping of tokenId to SpaceDetails
    mapping(uint256 => SpaceDetails) public spaceInfo;

    //Holds the address of the deployed token
    DecentramallToken public token;

    //Holds the address of the EstateAgent
    EstateAgent public estateAgent;

    event SetToken(address indexed _newContract);
    event SetAgent(address indexed _newContract);
    event Deposit(address indexed from, uint256 tokenId);
    event Rented(address indexed renter, uint256 tokenId, uint256 rentPrice);
    event ClaimRent(address indexed owner, uint256 amount, uint256 toClaim);
    event Withdraw(address indexed to, uint256 tokenId);

    constructor(DecentramallToken _token, EstateAgent _estateAgent) public {
        token = _token;
        estateAgent = _estateAgent;
    }

    /**
     * @dev Set token address
     * @param _token the address of the newly deployed SPACE token
     * In case if token address ever changes, we can set this contract to point there
     */
    function setToken(DecentramallToken _token) external onlyAdmin {
        token = _token;
        emit SetToken(address(_token));
    }

    /**
     * @dev Set EstateAgent address
     * @param _estateAgent the address of the EstateAgent
     */
    function setAgent(EstateAgent _estateAgent) external onlyAdmin {
        estateAgent = _estateAgent;
        emit SetAgent(address(_estateAgent));
    }

    /**
    * @dev Deposit the SPACE token to this contract
    * @param tokenId ID of the token to check
    * @notice need to write an approve method
    **/
    function deposit(uint256 tokenId) public {
        require(token.verifyLegitimacy(msg.sender, tokenId) == true, "Fake token!");
        token.transferFrom(msg.sender, address(this), tokenId);

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
        address payable owner = msg.sender;
        claimRent(owner, tokenId);
        token.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    /**
    * @dev Allows users to rent a SPACE token of choice
    * @param tokenId ID of the token to check
    * @notice rent per year cost 1/10 of the price to buy new & lasts for 1 month (187714 blocks)
    **/
    function rent(uint256 tokenId, string memory _tokenURI) public payable{
        require(spaceInfo[tokenId].expiryBlock < block.number, "Token is already rented!");
        uint256 priceFinney = estateAgent.price(token.totalSupply()+1) * _multiplier;
        uint256 rentPrice = priceFinney / 120; //In wei
        require(msg.value >= (rentPrice * 1 wei), "Not enough funds!");
        spaceInfo[tokenId].rentedTo = msg.sender;
        spaceInfo[tokenId].rentalEarned += rentPrice;
        spaceInfo[tokenId].expiryBlock = block.number + 187714;
        token.setTokenURI(tokenId, _tokenURI);
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
            address currentOwner = token.ownerOf(tokenId);
            if(currentOwner == address(this)){
                //Token is here! Time to check spaceInfo
                return spaceInfo[tokenId].rightfulOwner;
            } else {
                return currentOwner;
            }
        }
    }

    /**
     * @dev Get balance
     * @return balance in RentalAgent contract
     */
    function balance() public view returns(uint256){
        address self = address(this);
        return self.balance;
    }
}