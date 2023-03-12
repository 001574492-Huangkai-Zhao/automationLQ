import{getERC20Balance} from '../libs/balance'
import{getPoolInfo} from '../libs/pool'
import{createTrade,executeTrade, swapWETH,getTokenTransferApproval} from '../libs/trading'
import { Token } from '@uniswap/sdk-core'
import { CurrentConfig } from '../tokens.config'
import {
    getProvider,
    getWalletAddress,
    sendTransaction,
    TransactionState,
  } from '../libs/providers'
  import {
    FeeAmount,
  } from '@uniswap/v3-sdk'
import { DAI_TOKEN } from '../libs/constants'
import {getPositionIds, getPositionInfo, mintPosition, removeLiquidity} from '../libs/positions'

export async function redeemTest() {
    const provider= getProvider()
    const walletAddress = getWalletAddress()
    const poolinfo = await getPoolInfo(CurrentConfig.tokensETHTether.token0, CurrentConfig.tokensETHTether.token1, FeeAmount.LOW)
    console.log(`sqrtPriceX96: ${poolinfo.sqrtPriceX96.toString()}`);
    console.log(`liquidity: ${poolinfo.liquidity.toString()}`);
    console.log(`tick: ${poolinfo.tick}`);

    console.log("Before redeem, position info: ")
    const num = await getPositionIds()
    const len = num.length
    if(len != 0) {
      for (let i = 0; i < len; i++) {
        const positionIndex = parseInt(num[i].toString());
        console.log(`positionIndex: ${positionIndex}`)
        const posi_info = await getPositionInfo(positionIndex)
        //console.log(posi_info)
        console.log(`position tickLower: ${posi_info.tickLower}`)
        console.log(`position tickUpper: ${posi_info.tickUpper}`)
        console.log(`position LQ: ${parseInt(posi_info.liquidity.toString())}`)
        console.log()
      }
    }
    console.log()

    const redeemRes = await removeLiquidity(CurrentConfig.tokensETHTether.token0, CurrentConfig.tokensETHTether.token1, FeeAmount.LOW, 204026)
    console.log(redeemRes)

    const poolinfoA = await getPoolInfo(CurrentConfig.tokensETHTether.token0, CurrentConfig.tokensETHTether.token1, FeeAmount.LOW)
    console.log(`sqrtPriceX96: ${poolinfoA.sqrtPriceX96.toString()}`);
    console.log(`liquidity: ${poolinfoA.liquidity.toString()}`);
    console.log(`tick: ${poolinfoA.tick}`);

    console.log("After redeem, position info: ")
    const numA = await getPositionIds()
    const lenA = numA.length
    if(lenA != 0) {
      for (let i = 0; i < lenA; i++) {
        const positionIndex = parseInt(numA[i].toString());
        console.log(`positionIndex: ${positionIndex}`)
        const posi_info = await getPositionInfo(positionIndex)
        //console.log(posi_info)
        console.log(`position tickLower: ${posi_info.tickLower}`)
        console.log(`position tickUpper: ${posi_info.tickUpper}`)
        console.log(`position LQ: ${parseInt(posi_info.liquidity.toString())}`)
        console.log()
      }
    }
}
redeemTest()