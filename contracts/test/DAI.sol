//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DAI is ERC20 {
    constructor(address[] memory accounts) public ERC20("DAI", "DAI") {
        for (uint256 i = 0; i < accounts.length; i++) {
            _mint(accounts[i], 500 * 10**18);
        }
    }
}
