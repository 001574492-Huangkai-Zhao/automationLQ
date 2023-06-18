import{getPoolInfo} from'../libs/pool'
import { Token } from '@uniswap/sdk-core'
import {
    FeeAmount,
  } from '@uniswap/v3-sdk'
import { BaseProvider } from '@ethersproject/providers'
import{tickToPriceRealWorld} from '../libs/positions'
import {getMainNetProvider} from '../libs/providers'
import {AutomationState} from '../src/automationConstants'
import { CurrentConfig } from '../tokens.config'
import fetch from 'cross-fetch'
const LQRatio = 0.01
import moment from 'moment';
/*
export async function checkPoolAndOracleState(): Promise<AutomationState>{
  const maxTolerance = 0.05
}
*/
var coinbaseETH: any 
var coinbaseUSDT: any 
var coinbaseUSDC: any 
var coinbaseDai: any 
async function getCoinBasePrice(): Promise<number>{
  let requestRaw: Response
  let requestJson
  
  while(true){
    requestRaw = await fetch('https://api.coinbase.com/v2/prices/USDT-USD/spot', {
      method: 'GET',
      headers: {},
    })
    if(requestRaw.status == 200){
      requestJson =await requestRaw.json()
      const coinbasePrice = requestJson.data.amount
      console.log(`coinbase Tether price: ${coinbasePrice}`)
      coinbaseUSDT=coinbasePrice
      break
    }
  }
  while(true){
    requestRaw = await fetch('https://api.coinbase.com/v2/prices/USDC-USD/spot', {
      method: 'GET',
      headers: {},
    })
    if(requestRaw.status == 200){
      requestJson =await requestRaw.json()
      const coinbasePrice = requestJson.data.amount
      console.log(`coinbase USDC price: ${coinbasePrice}`)
      coinbaseUSDC=coinbasePrice
      break
    }
  }
  while(true){
    requestRaw = await fetch('https://api.coinbase.com/v2/prices/Dai-USD/spot', {
      method: 'GET',
      headers: {},
    })
    if(requestRaw.status == 200){
      requestJson =await requestRaw.json()
      const coinbasePrice = requestJson.data.amount
      console.log(`coinbase Dai price: ${coinbasePrice}`)
      coinbaseDai=coinbasePrice
      break
    }
  }
  while(true){
    requestRaw = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot', {
      method: 'GET',
      headers: {},
    })
    if(requestRaw.status == 200){
      requestJson =await requestRaw.json()
      const coinbasePrice = requestJson.data.amount
      console.log(`coinbase price: ${coinbasePrice}`)
      coinbaseETH=coinbasePrice
      return coinbasePrice
    }
  }
}

async function getUniswapV3AndV2Price(): Promise<number>{
  const provider= getMainNetProvider()
  const poolInfo_ETH_Tether_500 = await getPoolInfo(
  CurrentConfig.tokensETHTether.token0,
  CurrentConfig.tokensETHTether.token1,
  FeeAmount.LOW,
  provider)

  const poolInfo_ETH_Tether_3000 = await getPoolInfo(
  CurrentConfig.tokensETHTether.token0,
  CurrentConfig.tokensETHTether.token1,
  FeeAmount.MEDIUM,
  provider)

  const poolInfo_ETH_Tether_10000 = await getPoolInfo(
    CurrentConfig.tokensETHTether.token0,
    CurrentConfig.tokensETHTether.token1,
    FeeAmount.HIGH,
    provider)

  const poolInfo_USDC_ETH_500 = await getPoolInfo(
  CurrentConfig.tokensUSDCETH.token0,
  CurrentConfig.tokensUSDCETH.token1,
  FeeAmount.LOW,
  provider)

  const poolInfo_USDC_ETH_3000 = await getPoolInfo(
  CurrentConfig.tokensUSDCETH.token0,
  CurrentConfig.tokensUSDCETH.token1,
  FeeAmount.MEDIUM,
  provider)

  const poolInfo_Dai_ETH_500 = await getPoolInfo(
  CurrentConfig.tokensDaiETH.token0,
  CurrentConfig.tokensDaiETH.token1,
  FeeAmount.LOW,
  provider)

  const poolInfo_Dai_ETH_3000 = await getPoolInfo(
  CurrentConfig.tokensDaiETH.token0,
  CurrentConfig.tokensDaiETH.token1,
  FeeAmount.MEDIUM,
  provider)

  const price_ETH_Tether_500 = tickToPriceRealWorld(poolInfo_ETH_Tether_500.tick, CurrentConfig.tokensETHTether.token0,
  CurrentConfig.tokensETHTether.token1)
  const price_ETH_Tether_3000 = tickToPriceRealWorld(poolInfo_ETH_Tether_3000.tick, CurrentConfig.tokensETHTether.token0,
  CurrentConfig.tokensETHTether.token1)
  const price_ETH_Tether_10000 = tickToPriceRealWorld(poolInfo_ETH_Tether_10000.tick, CurrentConfig.tokensETHTether.token0,
    CurrentConfig.tokensETHTether.token1)
  
  const price_USDC_ETH_500 = 1/tickToPriceRealWorld(poolInfo_USDC_ETH_500.tick, CurrentConfig.tokensUSDCETH.token0,
  CurrentConfig.tokensUSDCETH.token1)
  const price_USDC_ETH_3000 = 1/tickToPriceRealWorld(poolInfo_USDC_ETH_3000.tick, CurrentConfig.tokensUSDCETH.token0,
  CurrentConfig.tokensUSDCETH.token1)

  const price_Dai_ETH_500 = 1/tickToPriceRealWorld(poolInfo_Dai_ETH_500.tick, CurrentConfig.tokensDaiETH.token0,
  CurrentConfig.tokensDaiETH.token1)
  const price_Dai_ETH_3000 = 1/tickToPriceRealWorld(poolInfo_Dai_ETH_3000.tick, CurrentConfig.tokensDaiETH.token0,
  CurrentConfig.tokensDaiETH.token1)

  console.log(`price_ETH_Tether_500: ${price_ETH_Tether_500.toFixed(2)}`)
  console.log(`price_ETH_Tether_3000: ${price_ETH_Tether_3000.toFixed(2)}`)
  console.log(`price_ETH_Tether_10000: ${price_ETH_Tether_10000.toFixed(2)}`)
  console.log(`price_USDC_ETH_500: ${price_USDC_ETH_500.toFixed(2)}`)
  console.log(`price_USDC_ETH_3000: ${price_USDC_ETH_3000.toFixed(2)}`)
  console.log(`price_Dai_ETH_500: ${price_Dai_ETH_500.toFixed(2)}`)
  console.log(`price_Dai_ETH_3000: ${price_Dai_ETH_3000.toFixed(2)}`)
  console.log(`coinbaseUSDT: ${coinbaseUSDT}`)
  console.log(`coinbaseUSDC: ${coinbaseUSDC}`)
  console.log(`coinbaseDai: ${coinbaseDai}`)
  const avgPrice = (price_ETH_Tether_500 + price_ETH_Tether_3000+price_USDC_ETH_500+price_USDC_ETH_3000+price_Dai_ETH_500+price_Dai_ETH_3000)/6
  console.log(`average price of 6 pools in uniswap: ${avgPrice.toFixed(2)}`)
  return avgPrice
}
async function getAvgPrice(){
  //const time = Date.now()
  let time = new Date()
  //time.toISOString().slice(0, 10);
  var dateString = moment(time).format('YYYY_MM_DD');
  var dateStringWithTime = moment(time).format('YYYY_MM_DD HH:mm:ss');
  console.log(`at timestamp: ${dateString}`)
  console.log(`at timestamp: ${dateStringWithTime}`)
  const coinbaseP = await getCoinBasePrice()
  const uniswapP = await getUniswapV3AndV2Price()
  const avg = (+coinbaseP + +uniswapP)/2
  console.log(`average price of coinbase and uniswap pools: ${avg}`)
}
/*
async function checkTickChange(
    token0Info: Token,
    token1Info: Token,
    poolFee: FeeAmount,
    provider:BaseProvider,
    positionTickLower:number,
    positionTickUpper:number
    ): Promise<AutomationState>{
    const poolInfo = await getPoolInfo(token0Info,token1Info,poolFee,provider)
    if(poolInfo.tick<positionTickLower)
        return AutomationState.Price_hit_TickLower
    else if(poolInfo.tick>positionTickUpper)
        return AutomationState.Price_hit_TickUpper
    return AutomationState.Price_in_Range  
}
*/

getAvgPrice()

