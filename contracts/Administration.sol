// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

/** @title Administration contract
  * @notice Allows for a contract to be owned & controlled by admins
  */
contract Administration{
    //Mapping of admins
    mapping (address => bool) public adminByAddress;

    event AddAdmin(address newAdmin);
    event RemoveAdmin(address oldAdmin);

    modifier onlyAdmin {
        require(adminByAddress[msg.sender] == true, 'Not an admin!');
        _;
    }

    constructor() internal {
        // Register creator as admin
        adminByAddress[msg.sender] = true;
        emit AddAdmin(msg.sender);
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

    /**
     * @dev Verify Admin
     * @param admin the address of the admin to check
     * @return true if the address is an admin, false otherwise
     */
    function verifyAdmin(address admin) public view returns(bool){
        return adminByAddress[admin];
    }
}