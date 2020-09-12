//SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/** @title Decentramall SPACE token
  * @notice SPACE follows an ERC721 implementation
  * @dev Only one address can hold one SPACE token as the tokenID is a hash of the buyer's address
  */
contract DecentramallToken is ERC721 {
    // //Holds address of the EstateAgent
    // address private _agent;

    // //Ensures only the EstateAgent can mint/burn token
    // modifier onlyAgent {
    //     require(msg.sender == _agent, "Not an agent!");
    //     _;
    }

    // constructor(/*address agent*/) ERC721("Decentramall Space Token", "SPACE") public {
    //     // _agent = agent;
    // }

    //Max limit of tokens to be minted
    uint256 public _currentLimit;

    //Base price to start
    uint256 public _basePrice;

    //TEMPORARY Multiplier to get price in 10 Finney
    uint256 public _multiplier = 10000000000000000;

    // DecentramallToken public token;

    // event SetToken(DecentramallToken newContract);
    event SetLimit(uint256 limit);
    event Withdraw(address indexed to, uint256 amount);
    event BuyToken(address indexed buyer, uint256 price, uint256 tokenId);
    event SellToken(address indexed seller, uint256 price, uint256 tokenId);
    event Received(address indexed sender, uint256 value);

    constructor(uint256 currentLimit, uint256 basePrice) ERC721("Decentramall Space Token", "SPACE")public {
        _currentLimit = currentLimit;
        _basePrice = basePrice;
    }

    // receive() external payable {
    //     emit Received(msg.sender, msg.value);
    // }

    /**
     * @dev Withdraw funds from this contract
     * @param to address to withdraw to
     * @param amount the amount to withdraw
     * @notice TODO: Make it multisig so not one admin can withdraw all
     */
    function withdraw(address payable to, uint256 amount) external onlyAdmin{
        require(balance() > 0 && amount < balance(), "Impossible");
        to.transfer(amount);
        emit Withdraw(to, amount);
    }

    // /**
    //  * @dev Set token address
    //  * @param _newContract the address of the newly deployed SPACE token
    //  * In case if token address ever changes, we can set this contract to point there
    //  */
    // function setToken(DecentramallToken _newContract) external onlyAdmin {
    //     token = _newContract;
    //     emit SetToken(_newContract);
    // }

    /**
     * @dev Change the currentLimit variable (Max supply)
     * @param limit the current token minting limit
     * Only admin(s) can change this variable
     */
    function setLimit(uint256 limit) public onlyAdmin{
        _currentLimit = limit;
        emit SetLimit(limit);
    }

    /**
     * @dev Get price of next token
     * @param x the x value in the bonding curve graph
     * Assuming current bonding curve function of y = x^2 + basePrice
     * @return price at the specific position in bonding curve
     */
    function price(uint256 x) public view returns(uint256) {
        return ((x ** 2) + _basePrice);
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

        require(msg.value >= (quotedPrice * 1 wei), "Not enough funds to purchase token!");
        uint256 tokenId = _mint(msg.sender);

        require (totalSupply() > supplyBefore, "Token did not mint!");
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
        require(verifyLegitimacy(msg.sender, tokenId) == true, "Fake token!");
        uint256 supplyBefore = totalSupply();
        uint256 quotedPrice = price(supplyBefore) * _multiplier;

        require(quotedPrice <= balance(), "Price can't be higher than balance");
        _burn(tokenId);
        
        require(totalSupply() < supplyBefore, "Token did not burn");
        address payable seller = msg.sender;
        seller.transfer(quotedPrice * 1 wei);
        emit SellToken(msg.sender, quotedPrice, tokenId);
    }

    // /**
    //  * @dev Get currentLimit
    //  * @return current minting limit
    //  */
    // function limit() public view returns(uint256){
    //     return _currentLimit;
    // }

    // /**
    //  * @dev Get balance
    //  * @return balance in EstateAgent contract
    //  */
    // function balance() public view returns(uint256){
    //     address payable self = address(this);
    //     return self.balance;
    // }

    // /**
    //  * @dev Mint a token
    //  * @param purchaser address who purchase the SPACE token
    //  * @notice only the EstateAgent can call this function to prevent scams
    //  * @return id of the token minted
    //  */
    // function mint(address purchaser) public onlyAgent returns(uint256){
    //     uint256 tokenId = uint256(keccak256(abi.encodePacked(purchaser)));
    //     _safeMint(purchaser, tokenId, "");
    //     return (tokenId);
    // }

    // /**
    //  * @dev Burn a token
    //  * @param tokenId id of the token to burn
    //  */
    // function burn(uint256 tokenId) public onlyAgent{
    //     _burn(tokenId);
    // }

    // not safe, I know!
    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
     * @dev Verify if a token is legitimate (bought through the EstateAgent)
     * @param sender the address which initiated the action
     * @param tokenId id of the token to check
     */
    function verifyLegitimacy(address sender, uint256 tokenId) private view returns (bool) {
        return _exists(tokenId) && ownerOf(tokenId) == sender;
    }
}