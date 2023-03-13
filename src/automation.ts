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
import { rebalanceTokens,constructRebalancing} from './tokenRebalancing'


export async function AutoRedeem() {
  const provider= getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const token0 = CurrentConfig.tokensETHTether.token0
  const token1 = CurrentConfig.tokensETHTether.token1
  const poolFee = FeeAmount.LOW

  const poolInfo = await getPoolInfo(token0,token1, poolFee,provider)
  const currentTick = poolInfo.tick

  console.log("position info: ")
  const num = await getPositionIds(provider,wallet)
  const len = num.length
  if(len != 0) {
    for (let i = 0; i < len; i++) {
      const positionIndex = parseInt(num[i].toString());
      console.log(`positionIndex: ${positionIndex}`)
      let posi_info = await getPositionInfo(positionIndex,provider)
      const tickLower = posi_info.tickLower
      const tickUpper = posi_info.tickUpper
      console.log(`position tickLower: ${tickLower}`)
      console.log(`position tickUpper: ${tickUpper}`)
      console.log(`position LQ: ${parseInt(posi_info.liquidity.toString())}`)
      if(posi_info.liquidity.eq(0)) {
        continue
      }
      if(currentTick > tickUpper) {
        const redeemRes = await removeLiquidity(token0,token1, FeeAmount.LOW,provider,wallet, positionIndex)
        console.log("current price hit Upper range, redeem as Tether")
        posi_info = await getPositionInfo(positionIndex,provider)
        console.log(`position LQ after redeem: ${parseInt(posi_info.liquidity.toString())}`)
      } else if(currentTick < tickLower) {
        const redeemRes = await removeLiquidity(token0,token1, FeeAmount.LOW,provider,wallet, positionIndex)
        console.log("current price hit lower range, redeem as ETH")
        posi_info = await getPositionInfo(positionIndex,provider)
        console.log(`position LQ after redeem: ${parseInt(posi_info.liquidity.toString())}`)
      } else{
        console.log("current price stay in range of this position, no need for redeem!!!!!!!!")
      }
      console.log()
    }
  } 
  const token0Amount_LQ = await getERC20Balance(provider,wallet.address,token0.address)
  const token1Amount_LQ = await getERC20Balance(provider, wallet.address,token1.address)
  console.log(`after redeem: ${token0Amount_LQ}`);
  console.log(`after redeem: ${token1Amount_LQ}`);
}