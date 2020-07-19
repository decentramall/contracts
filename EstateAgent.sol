pragma solidity ^0.6.8;

import './DecentramallToken.sol';

contract EstateAgent {
    //Mapping of admins
    mapping (address => bool) public adminByAddress;

    //Mapping of buyers & their tokenID
    mapping (address => uint256) public tokenByOwner;

    //Mapping of legitimate buyers
    mapping (address => bool) public tokenHolder;

    //Max limit of tokens to be minted
    uint256 private _currentLimit;

    //Base price to start
    uint256 private _basePrice;

    DecentramallToken public token;

    modifier onlyAdmin {
        require(adminByAddress[msg.sender] == true, "Not an admin!");
        _;
    }

    modifier legitimateBuyer {
        require(tokenHolder[msg.sender] == true &&
        tokenByOwner[msg.sender] == uint256(keccak256(abi.encodePacked(msg.sender))), "Not legitimate!");
        _;
    }

    event TokenCreated(address token);
    event SetToken(DecentramallToken newContract);
    event SetLimit(uint256 limit);
    event Withdraw(address to, uint256 amount);
    event BuyToken(address buyer, uint256 price);
    event SellToken(address seller, uint256 price);
    event AddAdmin(address newAdmin);
    event RemoveAdmin(address oldAdmin);

    constructor(uint256 currentLimit, uint256 basePrice) public{
        token = new DecentramallToken(address(this));

        _currentLimit = currentLimit;
        _basePrice = basePrice;
        // Register creator as admin
        adminByAddress[msg.sender] = true;
        emit TokenCreated(address(token));
    }

    /**
     * @dev Withdraw funds from this contract
     *
     * TODO: Make it multisig so not one admin can withdraw all
     */
    function withdraw(address payable to, uint256 amount) external onlyAdmin{
        require(address(this).balance > 0 && amount < address(this).balance, "Impossible");
        to.transfer(amount);
        emit Withdraw(to, amount);
    }

    /**
     * @dev Set token address
     *
     * In case if token address ever changes, we can set this contract to point there
     */
    function setToken(DecentramallToken _newContract) external onlyAdmin {
        token = _newContract;
        emit SetToken(_newContract);
    }

    /**
     * @dev Return token address
     *
     * In case if token address ever changes, we can set this contract to point there
     */
    function tokenAddress() external view returns(address) {
        return(address(token));
    }

    /**
     * @dev Change the currentLimit variable (Max supply)
     *
     * Only admin(s) can change this variable
     */
    function setLimit(uint256 limit) public onlyAdmin{
        _currentLimit = limit;
        emit SetLimit(limit);
    }

    /**
     * @dev Get price of next token
     *
     * Assuming current bonding curve function of y = x^2 + basePrice
     *
     * Input is the x value
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
        require(token.totalSupply < _currentLimit, "Max supply reached!");
        uint256 supplyBefore = token.totalSupply();
        uint256 quotedPrice = price(supplyBefore + 1);
        require(msg.value >= (quotedPrice * 1 ether), "Not enough funds to purchase token!");
        uint256 tokenId = token.mint(msg.sender);
        require (token.totalSupply() > supplyBefore, "Token did not mint!");
        tokenHolder[msg.sender] = true;
        tokenByOwner[msg.sender] = tokenId;
        emit BuyToken(msg.sender, quotedPrice);
    }

    /**
     * @dev Sell a unique token
     *
     * Sell and burn the token that has been minted
     *
     * The price of the token is based on a bonding curve function
     */
    function sell() public legitimateBuyer{
        uint256 supplyBefore = token.totalSupply();
        uint256 quotedPrice = price(supplyBefore);
        require(quotedPrice < address(this).balance, "Price can't be higher than balance");
        token.burn(tokenByOwner[msg.sender]);
        require(token.totalSupply() < supplyBefore, "Token did not burn");
        tokenHolder[msg.sender] = false;
        tokenByOwner[msg.sender] = 0;
        msg.sender.transfer(quotedPrice);
        emit SellToken(msg.sender, quotedPrice);
    }

    /**
     * @dev Add a new admin
     *
     * Only admin(s) can add new admin
     */
    function addAdmin(address newAdmin) public onlyAdmin{
        adminByAddress[newAdmin] = true;
        emit AddAdmin(newAdmin);
    }

    /**
     * @dev Remove admin
     *
     * Self explanatory
     */
    function removeAdmin(address oldAdmin) public onlyAdmin{
        adminByAddress[oldAdmin] = false;
        emit RemoveAdmin(oldAdmin);
    }

    /**
     * @dev Get currentLimit
     *
     * Only admin(s) can add new admin
     */
    function limit() public view returns(uint256){
        return(_currentLimit);
    }

    /**
     * @dev Get balance
     */
    function balance() public view returns(uint256){
        return(address(this).balance);
    }
}