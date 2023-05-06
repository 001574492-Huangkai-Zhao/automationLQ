import{getERC20Balance} from '../libs/balance'
import{createTrade,executeTrade, swapWETH} from '../libs/trading'
import { CurrentConfig } from '../tokens.config'
import {getForkingChainProvider,createForkingChainWallet} from '../libs/providers'
import {FeeAmount,} from '@uniswap/v3-sdk'
import {mintPosition} from '../libs/positions'
import { rebalanceTokens} from '../src/tokenRebalancing'
import {AutoRedeemCV} from '../src/automation'
import { readEnv,writeEnv } from '../src/RWAutomationState'


async function AutoRedeemTest() {
    let currentAutomationInfo = await readEnv()
    const addLQresCV = await constructPosition(0.07,0.05)
    const addLQresAG = await constructPosition(0.12,0.12)
    currentAutomationInfo.CONSERVATIVE_POSITION_ID = addLQresCV
    currentAutomationInfo.AGGRESSIVE_POSITION_ID = addLQresAG
    writeEnv(currentAutomationInfo)
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
      .then((value)=>{AutoRedeemCV(provider,wallet)})
    const uncheckedTrade2 = await createTrade(5000, token0, token1, FeeAmount.LOW, provider)
    /*
    const redeem2 = await executeTrade(uncheckedTrade2, token0, provider, wallet)
      .then((value)=>{AutoRedeemCV(provider,wallet)})
      */
  }

  export async function constructPosition(tickLower: number,tickUpper: number) :Promise<number>{
    const provider= getForkingChainProvider()
    const wallet = createForkingChainWallet()
    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
    const receipt = await swapWETH(10, provider,wallet)
    await rebalanceTokens(provider, wallet, token0, token1, poolFee,tickLower,tickUpper)
    const positinID = await mintPosition(token0,token1, poolFee, tickLower,tickUpper, provider,wallet);
    console.log(`minted positio ID: ${positinID}`);
    console.log()
    const token0Amount_LQ = await getERC20Balance(provider,wallet.address,token0.address)
    const token1Amount_LQ = await getERC20Balance(provider, wallet.address,token1.address)
    //console.log(`after adding liquidity: ${token0Amount_LQ}`);
    //console.log(`after adding liquidity: ${token1Amount_LQ}`);
    return positinID
}
  
AutoRedeemTest()
