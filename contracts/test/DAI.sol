//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This is just a test contract to get DAI. It doesn't need to be perfect/secure

contract DAI is ERC20 {
    //Address who can mint
    address minter;

    constructor(address[] memory accounts) public ERC20("DAI", "DAI") {
        for (uint256 i = 0; i < accounts.length; i++) {
            _mint(accounts[i], 5000 * 10**18);
        }
        minter = msg.sender;
    }

    function mint(address to, uint256 amount) public{
        require(minter == msg.sender, "You can't mint!");
        _mint(to, amount);
    }
}
