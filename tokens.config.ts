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

