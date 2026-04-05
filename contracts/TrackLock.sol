// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrackLock {
    struct Obra {
        string titulo;
        string compositor;
        string cidPartitura;
        string cidLetra;
        string cidIdentidade;
        string cidComplementar;
        uint256 timestamp;
        address registradoPor;
    }

    mapping(bytes32 => Obra) public obras;

    event ObraRegistrada(
        bytes32 indexed hash,
        string titulo,
        string compositor,
        string cidPartitura,
        string cidLetra,
        string cidIdentidade,
        uint256 timestamp,
        address registradoPor
    );

    function registrar(
        string memory titulo,
        string memory compositor,
        string memory cidPartitura,
        string memory cidLetra,
        string memory cidIdentidade,
        string memory cidComplementar
    ) public returns (bytes32) {
        bytes32 hash = keccak256(
            abi.encodePacked(titulo, compositor, cidPartitura, cidLetra, cidIdentidade, block.timestamp, msg.sender)
        );

        obras[hash] = Obra(
            titulo,
            compositor,
            cidPartitura,
            cidLetra,
            cidIdentidade,
            cidComplementar,
            block.timestamp,
            msg.sender
        );

        emit ObraRegistrada(hash, titulo, compositor, cidPartitura, cidLetra, cidIdentidade, block.timestamp, msg.sender);

        return hash;
    }

    function verificar(bytes32 hash)
        public
        view
        returns (
            string memory titulo,
            string memory compositor,
            string memory cidPartitura,
            string memory cidLetra,
            string memory cidIdentidade,
            string memory cidComplementar,
            uint256 timestamp,
            address registradoPor
        )
    {
        Obra memory o = obras[hash];
        return (o.titulo, o.compositor, o.cidPartitura, o.cidLetra, o.cidIdentidade, o.cidComplementar, o.timestamp, o.registradoPor);
    }
}
