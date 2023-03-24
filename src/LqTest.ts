import{getERC20Balance} from '../libs/balance'
import{getPoolBalance, getPoolInfo, getTickInfo} from '../libs/pool'
import { CurrentConfig } from '../tokens.config'
import {
    getForkingChainProvider,
    createForkingChainWallet
  } from '../libs/providers'
  import {
    FeeAmount,
  } from '@uniswap/v3-sdk'
import {getPositionIds,getPositionInfo,removeLiquidity, tickToPriceRealWorld} from '../libs/positions'
import { ethers } from 'ethers'

async function queryTickLQ(tickLeft:number, tickRight:number) {
    const provider= getForkingChainProvider()
    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
    const poolInfo = await getPoolInfo(token0,token1, poolFee,provider)
    const tick_accurate = poolInfo.tick
    const remainder = tick_accurate % 10;
    let tick = tick_accurate-remainder
    if(remainder < 0 && tick_accurate < 0) {
        tick = tick-10;
    }
    let liquidity = poolInfo.liquidity
    const price = tickToPriceRealWorld(tick, CurrentConfig.tokensETHTether.token0,CurrentConfig.tokensETHTether.token1)
    //console.log(`current tick: ${tick_accurate}`)
    //console.log(`liquidity of current tick: ${liquidity}`)
    console.log(`${price.toFixed(0)}: liquidityCross: ${liquidity}`)
    for(let i = 0; tick + 10 < tickRight; i++) {
        tick = tick + 10
        const tickInfo = await getTickInfo(tick, token0,token1, poolFee,provider)
        //console.log(`tick ${tick}: `)
        //console.log(`liquidityGross: ${tickInfo.liquidityGross}`)
        //console.log(`liquidityNet: ${tickInfo.liquidityNet}`)
        const price = tickToPriceRealWorld(tick, CurrentConfig.tokensETHTether.token0,CurrentConfig.tokensETHTether.token1)
        const liquidityCross = liquidity.add(tickInfo.liquidityNet)
        liquidity = liquidityCross
        console.log(`${price.toFixed(0)}: liquidityCross: ${liquidityCross}`)
    }
    tick = tick_accurate-remainder
    if(remainder < 0 && tick_accurate < 0) {
        tick = tick-10;
    }
    liquidity = poolInfo.liquidity
    for(let i = 0; tick - 10 > tickLeft; i++) {
        tick = tick - 10
        const tickInfo = await getTickInfo(tick, token0,token1, poolFee,provider)
        const price = tickToPriceRealWorld(tick, CurrentConfig.tokensETHTether.token0,CurrentConfig.tokensETHTether.token1)
        //console.log(`tick ${tick}: `)
        //console.log(`liquidityGross: ${tickInfo.liquidityGross}`)
        //console.log(`liquidityNet: ${tickInfo.liquidityNet}`)
        const liquidityCross = liquidity.sub(tickInfo.liquidityNet)
        liquidity = liquidityCross
        console.log(`${price.toFixed(0)}: liquidityCross: ${liquidityCross}`)
    }
}
async function queryTickLQWithRange(change:number) {
    const provider = getForkingChainProvider()
    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
    const poolInfoBefore = await getPoolInfo(token0,token1,poolFee,provider)
    const tickBefore = poolInfoBefore.tick
  
    const tickUpper = tickBefore + Math.log(1+change) / Math.log(1.0001)
    const tickLower = tickBefore + Math.log(1-change) / Math.log(1.0001)
    await queryTickLQ(tickLower, tickUpper)
}

//queryTickLQ(-202199,-201199)
queryTickLQWithRange(0.2)