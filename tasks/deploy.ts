import '@nomiclabs/hardhat-waffle';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {rebalanceETHTether} from '../src/tokenRebalancing'

task('deploy', 'Deploy Greeter contract').setAction(
  async (_, hre: HardhatRuntimeEnvironment): Promise<void> => {
    const Greeter = await hre.ethers.getContractFactory('Greeter');
    const greeter = await Greeter.deploy('Hello, Hardhat!');

    await greeter.deployed();

    console.log('Greeter deployed to:', greeter.address);
  }
);

task('rebalanceTokens', 'balancing token pair for future LQ deposit').setAction(
  async (_, hre: HardhatRuntimeEnvironment): Promise<void> => {
    rebalanceETHTether()
  }
);
