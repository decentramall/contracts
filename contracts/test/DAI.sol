pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract DAI is ERC20 {
    constructor() public ERC20("DAI", "DAI") {
        //
    }

    function testFakeFundAddress(address _addr) public {
        _mint(_addr, 500 * 10 ** 18);
    }
}