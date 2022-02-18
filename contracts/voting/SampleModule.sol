// //https://gist.github.com/rmeissner/208e35db13d0ebf53b6e35838f1c8122
pragma solidity 0.8.9;

// // import "../test/Imports.sol"; //if uncomment --> errors about already declared identifier
import "../utils/interface/Safe.sol";
import "../utils/SignerV2.sol";
import "@gnosis.pm/safe-contracts/contracts/base/OwnerManager.sol";

// contract Enum {
//     enum Operation {
//         Call,
//         DelegateCall
//     }
// }


//SignerV2 functional
// (from SignerV2) function setSafe(address _safe);

// contract MasterCopy {
//     event ChangedMasterCopy(address masterCopy);

//     // masterCopy always needs to be first declared variable, to ensure that it is at the same location as in the Proxy contract.
//     // It should also always be ensured that the address is stored alone (uses a full word)
//     address private masterCopy;

//     modifier authorized() virtual {
//         require(
//             msg.sender == address(this),
//             "Method can only be called from this contract"
//         );
//         _;
//     }

//     /// @dev Allows to upgrade the contract. This can only be done via a Safe transaction.
//     /// @param _masterCopy New contract address.
//     function changeMasterCopy(address _masterCopy) public authorized {
//         // Master copy address cannot be null.
//         require(
//             _masterCopy != address(0),
//             "Invalid master copy address provided"
//         );
//         masterCopy = _masterCopy;
//         emit ChangedMasterCopy(_masterCopy);
//     }
// }

interface GnosisSafeVV2 is Safe{
    /// @dev Allows a Module to execute a Safe transaction without any further confirmations.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success);

    /// @dev Allows a Module to execute a Safe transaction without any further confirmations and return data
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success, bytes memory returnData);
}

// // Module type
// // Single Instance module (each safe has it's own module)
// // Centralized module (all safes use the same module)

contract RecoveryKeyModule{ //MasterCopy {
    GnosisSafeVV2 public safe;
    address public recoverer;

    // modifier authorized() {//override {
    //     require(
    //         msg.sender == address(safe),
    //         "Method can only be called from this contract"
    //     );
    //     _;
    // }

    function setup(address _recoverer) public {
        require(address(safe) == address(0), "Module has already been setup");
        safe = GnosisSafeVV2(msg.sender);
        recoverer = _recoverer;
    }

    function recover() external {
        require(msg.sender == recoverer, "You are not allowed to do that");
        // add additionalOwner as owner and set threshold to 1
        bytes memory data = abi.encodeWithSignature(
            "addOwnerWithThreshold(address,uint256)",
            recoverer,
            1
        );
        safe.execTransactionFromModule(
            address(safe),
            0,
            data,
            Enum.Operation.Call
        );
    }

    function remover(address forRemOwner) external { 
        require(msg.sender == recoverer, "You are not allowed to do that");
        // add additionalOwner as owner and set threshold to 1

        //prevOwner это тот Owner который собственно первым и создал пропозал на удаление  ownera, то есть тот от кого исходит предложение об удалении
        bytes memory data = abi.encodeWithSignature(
            "removeOwner(address,address,uint256)", 
            recoverer, //address prevOwner,
            forRemOwner, //address owner,
            1
        );
        safe.execTransactionFromModule(
            address(safe),
            0,
            data,
            Enum.Operation.Call
        );
    }
}

// /*
// To deploy run following js (web3js 0.4.x):
// let moduleSetupData = await recoveryModuleMasterCopy.contract.setup.getData()
// let moduleCreationData = await proxyFactory.contract.createProxy.getData(recoveryModuleMasterCopy.address, moduleSetupData)
// // see https://github.com/gnosis/safe-contracts/blob/development/test/utils/general.js#L9
// let enableModuleParameterData = utils.createAndAddModulesData([moduleCreationData])
// let enableModuleData = createAndAddModules.contract.createAndAddModules.getData(proxyFactory.address, enableModuleParameterData)
// // generate sigs
// let tx = await gnosisSafe.execTransaction(createAndAddModules.address, 0, enableModuleData, DelegateCall, 0, 0, 0, 0, 0, sigs)
// */

contract RecoveryKeyModuleCentral {
    mapping(address => address) recoverers;

    function register(address recoverer) public {
        recoverers[msg.sender] = recoverer;
    }

    function recover(GnosisSafeVV2 safe) external {
        // add additionalOwner as owner and set threshold to 1
        address recoverer = recoverers[address(safe)];
        require(msg.sender == recoverer, "You are not allowed to do that");
        bytes memory data = abi.encodeWithSignature(
            "addOwnerWithThreshold(address,uint256)",
            recoverer,
            1
        );
        safe.execTransactionFromModule(
            address(safe),
            0,
            data,
            Enum.Operation.Call
        );
    }
}

// /*
// To deploy run following js (web3js 0.4.x):
// let moduleSetupData = await recoveryModule.contract.register.getData(recoverer)
// // generate sigs
// let tx = await gnosisSafe.execTransaction(recoveryModule.address, 0, moduleSetupData, Call, 0, 0, 0, 0, 0, sigs)
// let enableModuleData = gnosisSafe.contract.enableModule.getData(recoveryModule.address)
// // generate sigs
// let tx = await gnosisSafe.execTransaction(gnosisSafe.address, 0, enableModuleData, Call, 0, 0, 0, 0, 0, sigs)
// */
