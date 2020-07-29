//SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/** @title Decentramall SPACE token
  * @notice SPACE follows an ERC721 implementation
  * @dev Only one address can hold one SPACE token as the tokenID is a hash of the buyer's address
  */
contract DecentramallToken is ERC721 {
    //Holds address of the EstateAgent
    address private _agent;

    //Ensures only the EstateAgent can mint/burn token
    modifier onlyAgent {
        require(msg.sender == _agent, "Not an agent!");
        _;
    }

    constructor(address agent) ERC721("Decentramall Space Token", "SPACE") public {
        _agent = agent;
    }

    /**
     * @dev Mint a token
     * @param purchaser address who purchase the SPACE token
     * @notice only the EstateAgent can call this function to prevent scams
     * @return id of the token minted
     */
    function mint(address purchaser) public onlyAgent returns(uint256){
        uint256 tokenId = uint256(keccak256(abi.encodePacked(purchaser)));
        _safeMint(purchaser, tokenId, "");
        return (tokenId);
    }

    /**
     * @dev Burn a token
     * @param tokenId id of the token to burn
     */
    function burn(uint256 tokenId) public onlyAgent{
        _burn(tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyAgent{
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
     * @dev Verify if a token is legitimate (bought through the EstateAgent)
     * @param sender the address which initiated the action
     * @param tokenId id of the token to check
     */
    function verifyLegitimacy(address sender, uint256 tokenId) public view returns (bool) {
        return _exists(tokenId) && ownerOf(tokenId) == sender;
    }
}