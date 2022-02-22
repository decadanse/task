/*

██████╗░██████╗░██╗███╗░░░███╗███████╗██████╗░░█████╗░░█████╗░
██╔══██╗██╔══██╗██║████╗░████║██╔════╝██╔══██╗██╔══██╗██╔══██╗
██████╔╝██████╔╝██║██╔████╔██║█████╗░░██║░░██║███████║██║░░██║
██╔═══╝░██╔══██╗██║██║╚██╔╝██║██╔══╝░░██║░░██║██╔══██║██║░░██║
██║░░░░░██║░░██║██║██║░╚═╝░██║███████╗██████╔╝██║░░██║╚█████╔╝
╚═╝░░░░░╚═╝░░╚═╝╚═╝╚═╝░░░░░╚═╝╚══════╝╚═════╝░╚═╝░░╚═╝░╚════╝░

*/

// SPDX-License-Identifier: GPL-3.0-or-later

/* solium-disable */
pragma solidity 0.8.9;

contract Enum {
    enum Operation {
        Call,
        DelegateCall
    }
}

interface Safe {
    function getTransactionHash(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address refundReceiver,
        uint256 _nonce
    ) external view returns (bytes32);


// function execTransaction(
//         address to,
//         uint256 value,
//         bytes calldata data,
//         Enum.Operation operation,
//         uint256 safeTxGas
//     ) external returns (bool success);

// function execTransaction(
//         address to,
//         uint256 value,
//         bytes calldata data,
//         Enum.Operation operation,
//         uint256 safeTxGas,
//         uint256 baseGas,
//         uint256 gasPrice,
//         address gasToken,
//         address payable refundReceiver,
//         bytes memory signatures
//     ) public payable virtual returns (bool success);
}



    