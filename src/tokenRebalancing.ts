import { ethers } from 'ethers'
import{getERC20Balance} from '../libs/balance'
import{getPoolInfo} from '../libs/pool'
import{createTrade,executeTrade} from '../libs/trading'
import { Token } from '@uniswap/sdk-core'
import {TransactionState,} from '../libs/providers'
import {FeeAmount} from '@uniswap/v3-sdk'
import {sqrtPriceToTick, tickToSqrtPrice, tickToPrice} from '../libs/positions'
import { BaseProvider } from '@ethersproject/providers'
import {PoolInfo} from '../libs/pool'
import { FeeLevel } from './automationConstants'


export interface tokenBalancingInfo {
  swap0for1: boolean,
  swapAmount: number
}
// TO DO:
//    Smart swap for least cost
export async function rebalanceTokens(provider: BaseProvider, wallet: ethers.Wallet, 
  token0: Token, token1: Token, leftRange: number, rightRange: number, feeLevel:FeeAmount
): Promise<TransactionState>{
    const walletAddress = wallet.address

    const token0Amount = await getERC20Balance(provider, walletAddress,token0.address)
    const token1Amount = await getERC20Balance(provider, walletAddress,token1.address)
    console.log(`before trade: ${token0Amount}`);
    console.log(`before trade: ${token1Amount}`);
    const swapInfo = await constructRebalancingAsymmetry(provider, token0Amount, token0, token1Amount, token1, leftRange, rightRange, feeLevel)
    let rebalancingResult
    if(swapInfo.swap0for1){
      rebalancingResult = await rebalancing(token0, token1, swapInfo.swapAmount, provider, wallet)
    }else{
      rebalancingResult = await rebalancing(token1, token0, swapInfo.swapAmount, provider, wallet)
    }
    if(rebalancingResult == TransactionState.Failed) {
      return TransactionState.Failed
    }
    console.log()
    const token0AmountAF = await getERC20Balance(provider, walletAddress,token0.address)
    const token1AmountAF = await getERC20Balance(provider, walletAddress,token1.address)
    console.log('---------------Token0 & Token1 after deposit-------------------------')
    console.log(`Token0 balance after rebalancing: ${token0AmountAF}`);
    console.log(`Token1 balance after rebalancing: ${token1AmountAF}`);
    console.log('---------------------------------------------')
    return rebalancingResult
    //const positinID = await mintPosition(token0,token1, poolFee,range,provider,wallet);
        // need to handle tx fail
    //console.log(`minted positio ID: ${positinID}`);
    //console.log()
    //const token0Amount_LQ = await getERC20Balance(provider,walletAddress,token0.address)
    //const token1Amount_LQ = await getERC20Balance(provider, walletAddress,token1.address)
    //console.log(`after adding liquidity: ${token0Amount_LQ}`);
    //console.log(`after adding liquidity: ${token1Amount_LQ}`);
}
// calculate the swap amount
export async function constructRebalancing(provider: BaseProvider, amount0:number, token0:Token, amount1: number, token1:Token, 
  range: number, feeLevel:FeeAmount): Promise<tokenBalancingInfo>  {
  return constructRebalancingAsymmetry(provider, amount0, token0, amount1, token1, range, range, feeLevel)
}
// calculate the swap amount 
export async function constructRebalancingAsymmetry(provider: BaseProvider, amount0:number, token0:Token, amount1: number, token1:Token, 
  leftRange: number, rightRange: number, feeLevel:FeeAmount): Promise<tokenBalancingInfo>  {
  const decimal0 = token0.decimals
  const decimal1 = token1.decimals
  const poolInfo = await getPoolInfo(token0,token1,feeLevel,provider)
  const poolTick = poolInfo.tick
  const poolPrice = tickToPrice(poolTick);
  const sqrtprice = Math.pow(poolPrice, 0.5);
  console.log(`pool price: ${poolPrice}`);
  const sqrtPriceUpperTemp = sqrtprice * Math.pow((1+rightRange), 0.5);
  const sqrtPriceLowerTemp = sqrtprice * Math.pow((1-leftRange), 0.5);
  const tickUpper = sqrtPriceToTick(sqrtPriceUpperTemp);
  const tickLower = sqrtPriceToTick(sqrtPriceLowerTemp);
  const sqrtPriceUpper = tickToSqrtPrice(tickUpper)
  const sqrtPriceLower = tickToSqrtPrice(tickLower)
  //console.log(`sqrtPriceUpper: ${sqrtPriceUpper}`);
  //console.log(`sqrtPriceLower: ${sqrtPriceLower}`);
  //console.log(`sqrtPriceUpperTemp: ${sqrtPriceUpperTemp}`);
  //console.log(`sqrtPriceLowerTemp: ${sqrtPriceLowerTemp}`);
  console.log(`tickLower: ${tickLower}`);
  console.log(`tickUpper: ${tickUpper}`);
  
  let swap0for1
  const constant = (1/sqrtprice - 1/sqrtPriceUpper)/(sqrtprice - sqrtPriceLower);
  let swapAmount
  const swap0 = (amount0 - amount1*constant)/(1+constant*poolPrice*(1-FeeAmount.LOW/100000));
  
  if(swap0 > 0) {
    swap0for1=true
    //swapAmount = swap0*Math.pow(10, -decimal0)
    //truncate amount to avoid 'fractional component exceeds decimals' error
    swapAmount = Math.trunc(swap0*Math.pow(10, -decimal0));
    console.log(`going to swap in ${token0.name} amount: ${swapAmount}`);
  } else {
    swap0for1=false
    //const swap1= -(amount0 - amount1*constant)/(constant + (1-FeeAmount.LOW/100000)/poolPrice);
    const swap1= -(amount0 - amount1*constant)/(constant + (1-FeeAmount.LOW/100000)/poolPrice);
    swapAmount = Math.trunc(swap1*Math.pow(10, -decimal1))
    console.log(`going to swap in ${token1.name} amount: ${swapAmount}`);
  }
 return{swap0for1, swapAmount}
}

// execute token swap according to the result of constructRebalancingAsymmetry
async function rebalancing(token0: Token, token1: Token, swapAmount: number,provider: BaseProvider,wallet: ethers.Wallet): Promise<TransactionState>{
  try {
    const uncheckedTrade = await createTrade(swapAmount, token0, token1, FeeAmount.LOW, provider)
    const swapOutput = await executeTrade(uncheckedTrade, token0, provider, wallet)
    if(swapOutput == TransactionState.Failed) {
      console.log('swap failed when rebalancing tokens, please chack out the reason')
    }
    // need to handle tx fail
    return swapOutput;
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}
