import { RunSuperFunction, HardhatRuntimeEnvironment } from 'hardhat/types';
export default function (args: any, hre: HardhatRuntimeEnvironment, run: RunSuperFunction<any>): Promise<void>;
export declare function getForkedNetwork(hre: HardhatRuntimeEnvironment): string;
