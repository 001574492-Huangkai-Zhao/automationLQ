import{getERC20Balance} from '../libs/balance'
import{getPoolInfo} from '../libs/pool'
import{createTrade,executeTrade, swapWETH,checkTokenTransferApproval} from '../libs/trading'
import { Token } from '@uniswap/sdk-core'
import { CurrentConfig } from '../tokens.config'
import {
    getForkingChainProvider,
    getWalletAddress,
    sendTransaction,
    TransactionState,
    createMainNetWallet,
    createForkingChainWallet
  } from '../libs/providers'
  import {
    FeeAmount,
  } from '@uniswap/v3-sdk'
import { DAI_TOKEN } from '../libs/constants'
import {mintPosition,getPositionIds,getPositionInfo,removeLiquidity} from '../libs/positions'
import { rebalanceTokens,constructRebalancing} from '../src/tokenRebalancing'
import {AutoRedeem} from '../src/automation'


async function AutoRedeemTest() {
    const addLQres15 = await constructPosition(0.15)
    const addLQres5 = await constructPosition(0.05)
    const addLQres2 = await constructPosition(0.02)
    const provider= getForkingChainProvider()
    const wallet = createForkingChainWallet()
    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
  
    const receipt = await swapWETH(8000, provider, wallet)
    const token0Amount= await getERC20Balance(provider,wallet.address,token0.address)
    console.log(`WETH balance: ${token0Amount}`);
    const uncheckedTrade = await createTrade(2500, token0, token1, FeeAmount.LOW, provider)
    const redeem1 = await executeTrade(uncheckedTrade, token0, provider, wallet)
      .then((value)=>{AutoRedeem()})
    const uncheckedTrade2 = await createTrade(5000, token0, token1, FeeAmount.LOW, provider)
    const redeem2 = await executeTrade(uncheckedTrade2, token0, provider, wallet)
      .then((value)=>{AutoRedeem()})
  }

  export async function constructPosition(positionRange: number) {
    const provider= getForkingChainProvider()
    const wallet = createForkingChainWallet()
    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
    const receipt = await swapWETH(100, provider,wallet)
    await rebalanceTokens(provider, wallet, token0, token1, poolFee, positionRange)
    const positinID = await mintPosition(token0,token1, poolFee, positionRange,provider,wallet);
    console.log(`minted positio ID: ${positinID}`);
    console.log()
    const token0Amount_LQ = await getERC20Balance(provider,wallet.address,token0.address)
    const token1Amount_LQ = await getERC20Balance(provider, wallet.address,token1.address)
    //console.log(`after adding liquidity: ${token0Amount_LQ}`);
    //console.log(`after adding liquidity: ${token1Amount_LQ}`);
}
  
  AutoRedeemTest()