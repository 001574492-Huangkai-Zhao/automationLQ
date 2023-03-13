import { ethers,BigNumber } from 'ethers'
import{createTradeEXACT_OUTPUT, getOutputQuote, swapWETH,transferWETH} from '../libs/trading'
import{getPoolInfo} from'../libs/pool'
import { Token } from '@uniswap/sdk-core'
import {
    computePoolAddress,
    FeeAmount,
    Pool,
    Route,
    SwapOptions,
    SwapQuoter,
    SwapRouter,
    toHex,
    Trade,
  } from '@uniswap/v3-sdk'
import { BaseProvider } from '@ethersproject/providers'
import{tickToPrice, tickToPriceRealWorld} from '../libs/positions'
import {getForkingChainProvider,getMainNetProvider,createForkingChainWallet,createForkingChainWallet1,createForkingChainWallet2} from '../libs/providers'
import {AutomationState,MaxPriceTolerance} from '../src/automationConstants'
import { CurrentConfig } from '../tokens.config'
import {createTrade,executeTrade} from '../libs/trading'
import { getERC20Balance } from '../libs/balance'

const LQRatio = 0.01
/*
export async function checkPoolAndOracleState(): Promise<AutomationState>{
  const maxTolerance = 0.05
}
*/
async function getCoinBasePrice(): Promise<number>{
  let requestRaw: Response
  let requestJson
  while(true){
    requestRaw = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot', {
      method: 'GET',
      headers: {},
    })
    if(requestRaw.status == 200){
      requestJson =await requestRaw.json()
      const coinbasePrice = requestJson.data.amount
      console.log(`coinbase price: ${coinbasePrice}`)
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
  FeeAmount.HIGH,
  provider)

  const poolInfo_Dai_ETH_500 = await getPoolInfo(
  CurrentConfig.tokensDaiETH.token0,
  CurrentConfig.tokensDaiETH.token1,
  FeeAmount.LOW,
  provider)

  const poolInfo_Dai_ETH_3000 = await getPoolInfo(
  CurrentConfig.tokensDaiETH.token0,
  CurrentConfig.tokensDaiETH.token1,
  FeeAmount.HIGH,
  provider)

  const price_ETH_Tether_500 = tickToPriceRealWorld(poolInfo_ETH_Tether_500.tick, CurrentConfig.tokensETHTether.token0,
  CurrentConfig.tokensETHTether.token1)
  const price_ETH_Tether_3000 = tickToPriceRealWorld(poolInfo_ETH_Tether_3000.tick, CurrentConfig.tokensETHTether.token0,
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
  console.log(`price_USDC_ETH_500: ${price_USDC_ETH_500.toFixed(2)}`)
  console.log(`price_USDC_ETH_3000: ${price_USDC_ETH_3000.toFixed(2)}`)
  console.log(`price_Dai_ETH_500: ${price_Dai_ETH_500.toFixed(2)}`)
  console.log(`price_Dai_ETH_3000: ${price_Dai_ETH_3000.toFixed(2)}`)

  const avgPrice = (price_ETH_Tether_500 + price_ETH_Tether_3000+price_USDC_ETH_500+price_USDC_ETH_3000+price_Dai_ETH_500+price_Dai_ETH_3000)/6
  console.log(`average price of 6 pools in uniswap: ${avgPrice.toFixed(2)}`)
  return avgPrice
}
async function getAvgPrice(){
  const time = Date.now()
  console.log(`at timestamp: ${time}`)
  const coinbaseP = await getCoinBasePrice()
  const uniswapP = await getUniswapV3AndV2Price()
  const avg = (+coinbaseP + +uniswapP)/2
  console.log(`average price of coinbase and uniswap pools: ${avg}`)
}
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

async function getPoolLQValue(
  token0: Token,
  token1: Token,
  poolFee: FeeAmount,
  range: number
){
  const swapEthAmount = 500
  const provider = getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const wallet1 = createForkingChainWallet1()
  const wallet2 = createForkingChainWallet2()
  const walletAddress = wallet.address
  const receipt = await swapWETH(9000, provider, wallet)
  const receipt1 = await swapWETH(9000,provider,wallet1)
  const receipt2 = await swapWETH(9000,provider,wallet2)
  const receipt3 = await transferWETH(9000,provider,wallet1,wallet)
  const receipt4 = await transferWETH(9000,provider,wallet2,wallet)
  const token0Amount = await getERC20Balance(provider,walletAddress,token0.address)
  //const token1Amount = await getERC20Balance(provider,walletAddress,token1.address)
  console.log(`before trade: ${token0Amount}`);
  //console.log(`before trade: ${token1Amount}`);

  const poolInfoBefore = await getPoolInfo(token0,token1,poolFee,provider)
  const tickBefore = poolInfoBefore.tick
  const priceBefore = tickToPriceRealWorld(tickBefore, CurrentConfig.tokensETHTether.token0,
    CurrentConfig.tokensETHTether.token1)
  console.log(`tickBefore: ${tickBefore}`);
  console.log(`Price Before: ${priceBefore}`);
  const tickUpper = tickBefore + Math.log(1+range) / Math.log(1.0001)
  const tickLower = tickBefore + Math.log(1-range) / Math.log(1.0001)
  console.log(`tickUpper: ${tickUpper}`)
  console.log(`tickLower: ${tickLower}`)
  console.log();
  let poolInfo = await getPoolInfo(token0,token1,poolFee,provider)
  let ETHAmount = 0
  while(poolInfo.tick > tickLower){
    const uncheckedTrade = await createTrade(swapEthAmount, token0, token1, FeeAmount.LOW, provider)
    const swapOutput = await executeTrade(uncheckedTrade, token0, provider, wallet)

    poolInfo = await getPoolInfo(token0,token1,poolFee,provider)
    const priceAfterSwap = tickToPriceRealWorld(poolInfo.tick, CurrentConfig.tokensETHTether.token0,
      CurrentConfig.tokensETHTether.token1)
    console.log(`tick after: ${poolInfo.tick}`);
    console.log(`price after: ${priceAfterSwap}`);
    console.log();
    ETHAmount = ETHAmount+500
  }
  console.log(ETHAmount)
}

async function recover(
  token0: Token,
  token1: Token,
  poolFee: FeeAmount
){
  const provider = getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const walletAddress = wallet.address

  const token0Amount = await getERC20Balance(provider,walletAddress,token0.address)
  const token1Amount = await getERC20Balance(provider,walletAddress,token1.address)
  const token1AmountToSwapIn = token1Amount*0.96
  console.log(`before trade: ${token1Amount}`);

  const uncheckedTrade = await createTrade(+token1AmountToSwapIn.toFixed(0)/Math.pow(10,token1.decimals), token1, token0, FeeAmount.LOW, provider)
  const swapOutput = await executeTrade(uncheckedTrade, token1, provider, wallet)
  const poolInfo = await getPoolInfo(token0,token1,poolFee,provider)
  const priceAfterSwap = tickToPriceRealWorld(poolInfo.tick, CurrentConfig.tokensETHTether.token0,
    CurrentConfig.tokensETHTether.token1)
  console.log(`tick after: ${poolInfo.tick}`);
  console.log(`price after: ${priceAfterSwap}`);
  console.log();
  //const token0AmountA = await getERC20Balance(provider,walletAddress,token0.address)
  //console.log(`after recover: ${token0AmountA}`);
}

async function swapInTetherTest(
  range: number
){
  const swapTetherAmount = 800000
  const eth = CurrentConfig.tokensETHTether.token0
  const tether = CurrentConfig.tokensETHTether.token1
  const usdc = CurrentConfig.tokensUSDCETH.token0

  const provider = getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const walletAddress = wallet.address

  const ethAmount = await getERC20Balance(provider,walletAddress,eth.address)
  console.log(`eth amount: ${ethAmount}`);
  
  //swap eth for usdc
  const uncheckedTradeETHUSDC = await createTrade(5000, eth, usdc, FeeAmount.LOW, provider)
  await executeTrade(uncheckedTradeETHUSDC, eth, provider, wallet)
  const usdcAmount = await getERC20Balance(provider, walletAddress, usdc.address)
  const usdcAmountToSwapIn = usdcAmount*0.96
  console.log(`usdc amount: ${usdcAmount}`);

  //swap usdc for tether
  const uncheckedTradeUSDCTether = await createTrade(+usdcAmountToSwapIn.toFixed(0)/Math.pow(10,usdc.decimals), usdc, tether, FeeAmount.LOW, provider)
  await executeTrade(uncheckedTradeUSDCTether, usdc, provider, wallet)
  const tetherAmount = await getERC20Balance(provider, walletAddress, tether.address)
  console.log(`tether amount: ${tetherAmount}`);

  const poolInfoBefore = await getPoolInfo(eth,tether,FeeAmount.LOW,provider)
  const tickBefore = poolInfoBefore.tick
  const priceBefore = tickToPriceRealWorld(tickBefore, CurrentConfig.tokensETHTether.token0,
    CurrentConfig.tokensETHTether.token1)
  console.log(`tickBefore: ${tickBefore}`);
  console.log(`Price Before: ${priceBefore}`);
  const tickUpper = tickBefore + Math.log(1+range) / Math.log(1.0001)
  const tickLower = tickBefore + Math.log(1-range) / Math.log(1.0001)
  console.log(`tickUpper: ${tickUpper}`)
  console.log(`tickLower: ${tickLower}`)
  console.log();
  let poolInfo = await getPoolInfo(eth,tether,FeeAmount.LOW,provider)
  while(poolInfo.tick < tickUpper){
    const uncheckedTrade = await createTrade(swapTetherAmount, tether, eth, FeeAmount.LOW, provider)
    const swapOutput = await executeTrade(uncheckedTrade, tether, provider, wallet)

    poolInfo = await await getPoolInfo(eth,tether,FeeAmount.LOW,provider)
    const priceAfterSwap = tickToPriceRealWorld(poolInfo.tick, CurrentConfig.tokensETHTether.token0,
      CurrentConfig.tokensETHTether.token1)
    console.log(`tick after: ${poolInfo.tick}`);
    console.log(`price after: ${priceAfterSwap}`);
    console.log();
  }
}

//getAvgPrice()
getPoolLQValue(CurrentConfig.tokensETHTether.token0, CurrentConfig.tokensETHTether.token1,FeeAmount.LOW, 0.1)
//.then((value)=>{recover(CurrentConfig.tokensETHTether.token0, CurrentConfig.tokensETHTether.token1,FeeAmount.LOW)})

//swapInTetherTest(0.1)
