pragma solidity ^0.6.8;

import './EstateAgent.sol';
import './DecentramallToken.sol';

contract RentalAgent is Administration{
    struct SpaceDetails {
        address rightfulOwner;
        address rentedTo;
        uint256 rentalEarned;
        uint256 expiryBlock;
    }

    mapping(uint256 => SpaceDetails) public spaceInfo;

    DecentramallToken public token;
    EstateAgent public estateAgent;

    event SetToken(address _newContract);
    event SetAgent(address _newContract);
    event Deposit(address from, uint256 tokenId);
    event Rented(address renter, uint256 tokenId);
    event Withdraw(address to, uint256 tokenId);

    constructor(DecentramallToken _token, EstateAgent _estateAgent) public {
        token = _token;
        estateAgent = _estateAgent;
    }

    /**
     * @dev Set token address
     * @param spaceToken the address of the newly deployed SPACE token
     * In case if token address ever changes, we can set this contract to point there
     */
    function setToken(DecentramallToken spaceToken) external onlyAdmin {
        token = spaceToken;
        emit SetToken(address(spaceToken));
    }

    /**
     * @dev Set EstateAgent address
     * @param estateContract the address of the EstateAgent
     */
    function setAgent(EstateAgent estateContract) external onlyAdmin {
        estateAgent = estateContract;
        emit SetAgent(address(estateContract));
    }

    /**
    * @dev Deposit the SPACE token to this contract
    * @param tokenId ID of the token to check
    **/
    function deposit(uint256 tokenId) public {
        require(token.verifyLegitimacy(msg.sender, tokenId) == true, "Fake token!");
        token.safeTransferFrom(msg.sender, address(this), tokenId);

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
        claimRent(tokenId);
        token.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    /**
    * @dev Allows users to rent a SPACE token of choice
    * @param tokenId ID of the token to check
    **/
    function rent(uint256 tokenId) public payable{
        require(spaceInfo[tokenId].expiryBlock < block.number, "Token is already rented!");
        //To rent, it costs 1/10 to buy new
        uint256 rentPrice = (estateAgent.price(token.totalSupply() + 1 ) / 10);
        require(msg.value >= (rentPrice * 1 finney), "Not enough funds!");

        spaceInfo[tokenId].rentedTo = msg.sender;
        spaceInfo[tokenId].rentalEarned += rentPrice;
        spaceInfo[tokenId].expiryBlock = block.number + 2252571; //roughly 1 year
    }

    /**
    * @dev Claim the rent earned
    * @param tokenId id of the SPACE token
    * @notice Owner can claim rent right on Day 1 of renting
    **/
    function claimRent(uint256 tokenId) public {
        require(spaceInfo[tokenId].rightfulOwner == msg.sender, "Not owner!");
        uint256 toClaim = spaceInfo[tokenId].rentalEarned;
        require(address(this).balance >= toClaim, "Not enough funds to pay!");
        spaceInfo[tokenId].rentalEarned -= toClaim;
        msg.sender.transfer(toClaim);
    }

    /**
    * @dev Check who has the rights to use the token currently
    * @param tokenId ID of the token to check
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
     * @dev Add a new admin
     * @param newAdmin the address of the admin to add
     * Only admin(s) can add new admin
     */
    function addAdmin(address newAdmin) public onlyAdmin{
        adminByAddress[newAdmin] = true;
        emit AddAdmin(newAdmin);
    }

    /**
     * @dev Remove admin
     * @param oldAdmin the address of the admin to remove
     * Self explanatory
     */
    function removeAdmin(address oldAdmin) public onlyAdmin{
        adminByAddress[oldAdmin] = false;
        emit RemoveAdmin(oldAdmin);
    }
}