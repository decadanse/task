const { getBalancerContractAddress } = require("@balancer-labs/v2-deployments");

const deployFunction = async ({ getNamedAccounts, deployments, network }) => {

  const { deploy } = deployments;
  const { root } = await getNamedAccounts();

  await deploy("Ballot", {
    from: root,
    args: [["Option One","Option 2","Option3"]],
    log: true,
  });

};

module.exports = deployFunction;
module.exports.tags = ["Ballot"];
