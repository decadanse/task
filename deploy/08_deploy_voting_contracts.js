// let moduleSetupData = await recoveryModule.contract.register.getData(recoverer)
// // generate sigs
// let tx = await gnosisSafe.execTransaction(recoveryModule.address, 0, moduleSetupData, Call, 0, 0, 0, 0, 0, sigs)
// let enableModuleData = gnosisSafe.contract.enableModule.getData(recoveryModule.address)
// // generate sigs
// let tx = await gnosisSafe.execTransaction(gnosisSafe.address, 0, enableModuleData, Call, 0, 0, 0, 0, 0, sigs)

// const deployFunction = async ({ getNamedAccounts, deployments, network }) => {
//   const { deploy } = deployments;
//   const { root } = await getNamedAccounts();

//   await deploy("Voting", {
//     from: root,
//     args: [],
//     log: true,
//   });
// };

// module.exports = deployFunction;
// module.exports.tags = ["Voting"];
