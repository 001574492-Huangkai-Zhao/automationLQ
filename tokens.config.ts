import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { DAI_TOKEN, USDC_TOKEN,TETHER_TOKEN,WETH_TOKEN } from './libs/constants'

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  WALLET_EXTENSION,
  MAINNET,
}

// Inputs that configure this example to run
export interface NetworkConfig {
  env: Environment
  rpc: {
    local: string
    mainnet: string
  }
  wallet: {
    address: string
    privateKey: string
  }
  wallet1: {
    address: string
    privateKey: string
  }
  wallet2: {
    address: string
    privateKey: string
  }
  wallet3: {
    address: string
    privateKey: string
  }
  tokensETHTether: {
    token0: Token
    token1: Token
    poolFee: FeeAmount
  }
  tokensUSDCETH: {
    token0: Token
    token1: Token
    poolFee: FeeAmount
  }
  tokensDaiETH: {
    token0: Token
    token1: Token
    poolFee: FeeAmount
  }
  tokensUSDCTether: {
    token0: Token
    token1: Token
    poolFee: FeeAmount
  }
}

// Example Configuration

export const CurrentConfig: NetworkConfig = {
  env: Environment.LOCAL,
  rpc: {
    local: 'http://localhost:8545',
    mainnet: '',
  },
  wallet: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  wallet1: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey:
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  wallet2: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey:
      '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  },
  wallet3: {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey:
      '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  },
  tokensETHTether: {
    token0: WETH_TOKEN,
    token1: TETHER_TOKEN,
    poolFee: FeeAmount.LOW,
  },
  tokensUSDCETH: {
    token0: USDC_TOKEN,
    token1: WETH_TOKEN,
    poolFee: FeeAmount.LOW,
  },
  tokensDaiETH: {
    token0: DAI_TOKEN,
    token1: WETH_TOKEN,
    poolFee: FeeAmount.LOW,
  },
  tokensUSDCTether: {
    token0: USDC_TOKEN,
    token1: TETHER_TOKEN,
    poolFee: FeeAmount.LOW,
  }
}

