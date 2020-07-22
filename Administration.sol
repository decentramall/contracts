pragma solidity ^0.6.8;

contract Administration{
    //Mapping of admins
    mapping (address => bool) public adminByAddress;
    
    event AddAdmin(address newAdmin);
    event RemoveAdmin(address oldAdmin);

    modifier onlyAdmin {
        require(adminByAddress[msg.sender] == true, "Not an admin!");
        _;
    }

    constructor() internal {
        // Register creator as admin
        adminByAddress[msg.sender] = true;
        emit AddAdmin(msg.sender);
    }
}