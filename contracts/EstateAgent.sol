// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import './DecentramallToken.sol';
import './Administration.sol';

contract EstateAgent is Administration{
    //Max limit of tokens to be minted
    uint256 private _currentLimit;

    //Base price to start
    uint256 private _basePrice;

    DecentramallToken public token;

    event TokenCreated(address token);
    event SetToken(DecentramallToken newContract);
    event SetLimit(uint256 limit);
    event Withdraw(address to, uint256 amount);
    event BuyToken(address buyer, uint256 price, uint256 tokenId);
    event SellToken(address seller, uint256 price, uint256 tokenId);
    event Received(address sender, uint256 value);

    constructor(uint256 currentLimit, uint256 basePrice) public{
        token = new DecentramallToken(address(this));

        _currentLimit = currentLimit;
        _basePrice = basePrice;
        emit TokenCreated(address(token));
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

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

    /**
     * @dev Set token address
     * @param _newContract the address of the newly deployed SPACE token
     * In case if token address ever changes, we can set this contract to point there
     */
    function setToken(DecentramallToken _newContract) external onlyAdmin {
        token = _newContract;
        emit SetToken(_newContract);
    }

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
        require(token.totalSupply() < _currentLimit, "Max supply reached!");
        uint256 supplyBefore = token.totalSupply();
        uint256 quotedPrice = price(supplyBefore + 1);

        require(msg.value >= (quotedPrice * 1 finney), "Not enough funds to purchase token!");
        uint256 tokenId = token.mint(msg.sender);

        require (token.totalSupply() > supplyBefore, "Token did not mint!");
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
        require(token.verifyLegitimacy(msg.sender, tokenId) == true, "Fake token!");
        uint256 supplyBefore = token.totalSupply();
        uint256 quotedPrice = price(supplyBefore);

        require(quotedPrice <= balance(), "Price can't be higher than balance");
        token.burn(tokenId);
        
        require(token.totalSupply() < supplyBefore, "Token did not burn");
        address payable seller = msg.sender;
        seller.transfer(quotedPrice * 1 finney);
        emit SellToken(msg.sender, quotedPrice, tokenId);
    }

    /**
     * @dev Get currentLimit
     * @return current minting limit
     * Only admin(s) can add new admin
     */
    function limit() public view returns(uint256){
        return(_currentLimit);
    }

    /**
     * @dev Get balance
     * @return balance in EstateAgent contract
     */
    function balance() public view returns(uint256){
        address payable self = address(this);
        return self.balance;
    }
}