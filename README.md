# 🌌 SPACE Token & 🏠 Estate Agent
This section contains the SPACE token and EstateAgent for the project
<br/><br/>

## Idea
The idea is for an owner to purchase retail SPACE whose price follows a bonding curve. Additionally, an owner can only own one SPACE 
token to prevent someone from purchasing the entire retail space.
<br/><br/>

## Breakdown
### 🌌 SPACE Token
The SPACE token is created in the DecentramallToken.sol file. It follows a basic ERC721 implementation with nothing unique in particular. <br/>
However, to achieve the unique one-of-a-kind ownership and restriction, the ERC721 tokenID is based a *keccak256 hash* of the owner's
address, making it impossible for an owner to mint an ERC721 token twice.
<br/><br/>

### 🏠 Estate Agent
The EstateAgent houses the bonding curve function and purchasing and selling of SPACE tokens. <br />
Since the SPACE tokens have to be minted only when a buyer exists, the bonding curve requires a slight modification to its implementation. It allows for continuous minting of tokens but only up to a certain threshold which is declared during initialization under *_currentLimit*.
