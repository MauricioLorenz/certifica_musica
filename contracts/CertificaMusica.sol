// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertificaMusica
 * @dev Contrato ERC-721 para registro de autoria musical.
 *      Cada token representa uma obra registrada com metadata no IPFS.
 *      Apenas o owner (backend) pode mintar — usuários recebem o NFT.
 */
contract CertificaMusica is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event ObraRegistrada(
        uint256 indexed tokenId,
        address indexed para,
        string tokenURI,
        uint256 timestamp
    );

    constructor() ERC721("CertificaMusica", "CERT") Ownable(msg.sender) {}

    /// @notice Retorna o próximo tokenId que será usado no mint
    function nextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    /// @notice Minta um NFT de autoria para o endereço `to` com metadata em IPFS
    /// @param to     Endereço do recebedor (autor / plataforma)
    /// @param uri    URI da metadata — deve seguir o padrão "ipfs://CID"
    function mint(address to, string calldata uri)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit ObraRegistrada(tokenId, to, uri, block.timestamp);
        return tokenId;
    }
}
