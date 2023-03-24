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

async function queryPositionstate() {
    const provider= getForkingChainProvider()
    const wallet = createForkingChainWallet()
    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
    const poolInfo = await getPoolInfo(token0,token1, poolFee,provider)
    //console.log(poolInfo)
    const price = tickToPriceRealWorld(poolInfo.tick, CurrentConfig.tokensETHTether.token0,
        CurrentConfig.tokensETHTether.token1)
    const base2 = ethers.BigNumber.from(2)
    const div128 = base2.pow(128)
    console.log(`current tick: ${poolInfo.tick}`)
    console.log(`current price: ${price}`)
    console.log(`active tick LQ: ${poolInfo.liquidity}`)
    console.log(`feeGrowthGlobal0: ${poolInfo.feeGrowthGlobal0X128.div(div128)}`)
    console.log(`feeGrowthGlobal1: ${poolInfo.feeGrowthGlobal1X128.div(div128)}`)
}

async function queryTickstate(tick:number) {
  const provider= getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const token0 = CurrentConfig.tokensETHTether.token0
  const token1 = CurrentConfig.tokensETHTether.token1
  const poolFee = FeeAmount.LOW
  
  //console.log(poolInfo)
  const price = tickToPriceRealWorld(tick, CurrentConfig.tokensETHTether.token0,
      CurrentConfig.tokensETHTether.token1)
  const base2 = ethers.BigNumber.from(2)
  const div128 = base2.pow(128)
  //console.log(`price at specific tick: ${price}`)
  const tickInfo = await getTickInfo(tick, token0,token1, poolFee,provider)
  console.log(`tick ${tick} info: `)
  console.log(`liquidityGross: ${tickInfo.liquidityGross}`)
  console.log(`liquidityNet: ${tickInfo.liquidityNet}`)
  console.log(`feeGrowthOutside0: ${tickInfo.feeGrowthOutside0X128.div(div128)}`)
  console.log(`feeGrowthOutside1: ${tickInfo.feeGrowthOutside1X128.div(div128)}`)
  console.log(`tickCumulativeOutside: ${tickInfo.tickCumulativeOutside}`)
  console.log(`secondsPerLiquidityOutside: ${tickInfo.secondsPerLiquidityOutsideX128.div(div128)}`)
  console.log(`secondsOutside: ${tickInfo.secondsOutside}`)
  
}

async function queryCurrentTickstate() {
  const provider= getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const token0 = CurrentConfig.tokensETHTether.token0
  const token1 = CurrentConfig.tokensETHTether.token1
  const poolFee = FeeAmount.LOW
  const poolInfo = await getPoolInfo(token0,token1, poolFee,provider)
  const tick_accurate =  poolInfo.tick
  const remainder = tick_accurate % 10;
  let tick = tick_accurate-remainder
  if(remainder < 0 && tick_accurate < 0) {
    tick = tick-10;
  }
  const tickInfo = await getTickInfo(tick, token0,token1, poolFee,provider)
  //console.log(poolInfo)
  const price = tickToPriceRealWorld(tick_accurate, CurrentConfig.tokensETHTether.token0,
      CurrentConfig.tokensETHTether.token1)
  const base2 = ethers.BigNumber.from(2)
  const div128 = base2.pow(128)
  console.log(`current tick: ${tick_accurate}`)
  console.log(`current price: ${price}`)
  console.log(`tick ${tick} info: `)
  console.log(`liquidityGross: ${tickInfo.liquidityGross}`)
  console.log(`liquidityNet: ${tickInfo.liquidityNet}`)
  console.log(`feeGrowthOutside0: ${tickInfo.feeGrowthOutside0X128.div(div128)}`)
  console.log(`feeGrowthOutside1: ${tickInfo.feeGrowthOutside1X128.div(div128)}`)
  console.log(`tickCumulativeOutside: ${tickInfo.tickCumulativeOutside}`)
  console.log(`secondsPerLiquidityOutside: ${tickInfo.secondsPerLiquidityOutsideX128.div(div128)}`)
  console.log(`secondsOutside: ${tickInfo.secondsOutside}`)
}

async function queryLockBalance() {
  const provider= getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const token0 = CurrentConfig.tokensETHTether.token0
  const token1 = CurrentConfig.tokensETHTether.token1
  const poolFee = FeeAmount.LOW
  const poolBalance = await getPoolBalance(token0,token1, poolFee,provider)
  const token0Balance = poolBalance.token0Balance/Math.pow(10, token0.decimals)
  const token1Balance = poolBalance.token1Balance/Math.pow(10, token1.decimals)
  console.log(`token0Balance: ${token0Balance.toFixed(0)}`)
  console.log(`token1Balance: ${token1Balance.toFixed(0)}`)
}
//queryPositionstate()
//queryCurrentTickstate()
queryTickstate(-201300)
//queryLockBalance()