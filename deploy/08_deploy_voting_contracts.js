const { getBalancerContractAddress } = require("@balancer-labs/v2-deployments");

const deployFunction = async ({ getNamedAccounts, deployments, network }) => {

  const { deploy } = deployments;
  const { root } = await getNamedAccounts();
  const safeInstance = await ethers.getContract("Safe");

//????
  const lbpManagerFactoryInstance = await ethers.getContract(
    "LBPManagerFactory"
  );
  const seedFactoryInstance = await ethers.getContract("SeedFactory");

  const deployLBPManagerFunctionSignature =
    await lbpManagerFactoryInstance.interface.getSighash("deployLBPManager");

  const deploySeedFunctionSignature =
    await seedFactoryInstance.interface.getSighash("deploySeed");


let moduleSetupData = await recoveryModule.contract.register.getData(recoverer)
// generate sigs
let tx = await gnosisSafe.execTransaction(recoveryModule.address, 0, moduleSetupData, Call, 0, 0, 0, 0, 0, sigs)
let enableModuleData = gnosisSafe.contract.enableModule.getData(recoveryModule.address)
// generate sigs
let tx = await gnosisSafe.execTransaction(gnosisSafe.address, 0, enableModuleData, Call, 0, 0, 0, 0, 0, sigs)


  await deploy("Ballot", {
    from: root,
    args: [["Option One","Option 2","Option3"]],
    log: true,
  });


};

module.exports = deployFunction;
module.exports.tags = ["Ballot"];
