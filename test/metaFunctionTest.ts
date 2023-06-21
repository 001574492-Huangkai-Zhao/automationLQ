import{getERC20Balance} from '../libs/balance'
import{getPoolInfo} from '../libs/pool'
import{swapWETH,checkTokenTransferApproval} from '../libs/trading'
import { CurrentConfig } from '../tokens.config'
import {getForkingChainProvider,createForkingChainWallet} from '../libs/providers'
import {FeeAmount,} from '@uniswap/v3-sdk'
import {mintPosition,getPositionIds,getPositionInfo,removeLiquidity} from '../libs/positions'
import { rebalanceTokens} from '../src/tokenRebalancing'

export async function addLQTest(leftRange: number,rightRange: number) {
    const provider= getForkingChainProvider()
    const wallet = createForkingChainWallet()
    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
    const receipt = await swapWETH(100, provider,wallet)
            // need to handle tx fail
    const rebalanceTokenResult = await rebalanceTokens(provider, wallet, token0, token1, poolFee,leftRange, rightRange)
    const positinID = await mintPosition(token0,token1, poolFee, leftRange,rightRange,provider,wallet);

    console.log(`minted positio ID: ${positinID}`);
    console.log()
    const token0Amount_LQ = await getERC20Balance(provider,wallet.address,token0.address)
    const token1Amount_LQ = await getERC20Balance(provider, wallet.address,token1.address)
    //console.log(`after adding liquidity: ${token0Amount_LQ}`);
    //console.log(`after adding liquidity: ${token1Amount_LQ}`);
}
export async function checkApprovalTest() {
  const provider= getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const token0 = CurrentConfig.tokensETHTether.token0
  const token1 = CurrentConfig.tokensETHTether.token1
  const poolFee = FeeAmount.LOW
  await checkTokenTransferApproval(token0,provider,wallet)
}

export async function redeemTest() {
  const provider= getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const token0 = CurrentConfig.tokensETHTether.token0
  const token1 = CurrentConfig.tokensETHTether.token1
  const poolFee = FeeAmount.LOW
  const poolinfo = await getPoolInfo(token0,token1, poolFee,provider)
  console.log(`sqrtPriceX96: ${poolinfo.sqrtPriceX96.toString()}`);
  console.log(`liquidity: ${poolinfo.liquidity.toString()}`);
  console.log(`tick: ${poolinfo.tick}`);

  console.log("Before redeem, position info: ")
  const num = await getPositionIds(provider,wallet)
  const len = num.length
  if(len != 0) {
    for (let i = 0; i < len; i++) {
      const positionIndex = parseInt(num[i].toString());
      console.log(`positionIndex: ${positionIndex}`)
      const posi_info = await getPositionInfo(positionIndex,provider)
      //console.log(posi_info)
      console.log(`position tickLower: ${posi_info.tickLower}`)
      console.log(`position tickUpper: ${posi_info.tickUpper}`)
      console.log(`position LQ: ${parseInt(posi_info.liquidity.toString())}`)
      console.log()
      const redeemRes = await removeLiquidity(token0,token1, FeeAmount.LOW,provider,wallet, positionIndex)
          // need to handle tx fail
      const poolinfoA = await getPoolInfo(CurrentConfig.tokensETHTether.token0, CurrentConfig.tokensETHTether.token1, FeeAmount.LOW,provider)
      console.log(`liquidity: ${poolinfoA.liquidity.toString()}`);
    }
  }
  console.log()

  console.log("After redeem, position info: ")
  if(len != 0) {
    for (let i = 0; i < len; i++) {
      const positionIndex = parseInt(num[i].toString());
      console.log(`positionIndex: ${positionIndex}`)
      const posi_info = await getPositionInfo(positionIndex,provider)
      //console.log(posi_info)
      console.log(`position tickLower: ${posi_info.tickLower}`)
      console.log(`position tickUpper: ${posi_info.tickUpper}`)
      console.log(`position LQ: ${parseInt(posi_info.liquidity.toString())}`)
      console.log()
    }
  }
  const token0Amount_LQ = await getERC20Balance(provider,wallet.address,token0.address)
  const token1Amount_LQ = await getERC20Balance(provider, wallet.address,token1.address)
  console.log(`after remove liquidity: ${token0Amount_LQ}`);
  console.log(`after remove liquidity: ${token1Amount_LQ}`);
}

addLQTest(0.15,0.1)
.then((value)=>{checkApprovalTest()})
.then((value)=>{redeemTest()})
