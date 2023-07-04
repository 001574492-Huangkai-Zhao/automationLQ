import{getERC20Balance} from '../libs/balance'
import{createTrade,executeTrade, swapWETH} from '../libs/trading'
import { CurrentConfig } from '../tokens.config'
import {getForkingChainProvider,createForkingChainWallet, createForkingChainWallet1, createForkingChainWallet2, createForkingChainWallet3, TransactionState} from '../libs/providers'
import {FeeAmount,} from '@uniswap/v3-sdk'
import {getPositionInfo, tickToPriceRealWorld} from '../libs/positions'
import { rebalanceTokens} from '../src/tokenRebalancing'
import {AutoRedeemCV,AutoDepositCV} from '../src/automation'
import { readAutomationStats,writeAutomationStats,InitializeAutomationStatsCV} from '../src/RWAutomationState'
import {AutomationState,FeeLevel,TokenPair} from '../src/automationConstants'
import { getPoolInfo } from '../libs/pool'

// AutoRedeemCV function are used for providing liquidity for 500 fee Uniswap pool
async function AutoRedeemCVTest() {
  const provider= getForkingChainProvider()
  const wallet = createForkingChainWallet()
  const wallet1 = createForkingChainWallet1()
  const wallet2 = createForkingChainWallet2()
  const wallet3 = createForkingChainWallet3()
  const token0 = CurrentConfig.tokensETHTether.token0
  const token1 = CurrentConfig.tokensETHTether.token1
  
  let positionStats
  //construct position for testing
  let receipt = await swapWETH(100, provider,wallet)
          // need to handle tx fail
  InitializeAutomationStatsCV(wallet.address.substring(0,5),TokenPair.ETHTether,FeeLevel.LOW)
  let currentAutomationInfo = await readAutomationStats(wallet.address.substring(0,5))
  currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV = AutomationState.Executing_DepositLQ
  await writeAutomationStats(currentAutomationInfo,wallet.address.substring(0,5))
  await AutoDepositCV(0.03,0.02,provider,wallet)
  
  //Get 8000 WETH for testing || use wallet 2
  receipt = await swapWETH(9600, provider, wallet2)
          // need to handle tx fail
  //while-loop swap in ETH until pool price hit PriceLower
  currentAutomationInfo = await readAutomationStats(wallet.address.substring(0,5))
  const tickLower = currentAutomationInfo.CURRENT_LQ_RANGE_LOWER_CV
  const swapETHAmount = 1200
  let poolInfo = await getPoolInfo(token0,token1,FeeAmount.LOW,provider)
  while(poolInfo.tick > tickLower){
    console.log('loooooooooooooooooooooooooping')
    const uncheckedTrade = await createTrade(swapETHAmount, token0, token1, FeeAmount.LOW, provider)
    const swapOutput = await executeTrade(uncheckedTrade, token0, provider, wallet2)
    // need to handle tx fail
    if(swapOutput != TransactionState.Sent){
      break
    }
    poolInfo = await getPoolInfo(token0,token1,FeeAmount.LOW,provider)
    console.log(`tick after: ${poolInfo.tick}`);
    const priceAfterSwap = tickToPriceRealWorld(poolInfo.tick, CurrentConfig.tokensETHTether.token0,
      CurrentConfig.tokensETHTether.token1)
    console.log(`price after: ${priceAfterSwap}`);
    //check position Info in pool and position Info in local Json file
    //inside the while-loop position should not be closed
    await AutoRedeemCV(provider,wallet)
    positionStats = await getPositionInfo(currentAutomationInfo.CONSERVATIVE_POSITION_ID,provider)
    //console.log(positionStats)
    currentAutomationInfo = await readAutomationStats(wallet.address.substring(0,5))
    console.log(currentAutomationInfo)
  }
  //check position Info in pool and position Info in local Json file
  //Position should be closed after the while-loop
  await AutoRedeemCV(provider,wallet)
  positionStats = await getPositionInfo(currentAutomationInfo.CONSERVATIVE_POSITION_ID,provider)
  //console.log(positionStats)
  currentAutomationInfo = await readAutomationStats(wallet.address.substring(0,5))
  console.log(currentAutomationInfo)
  // Token0 & Token1 before deposit
  console.log('---------------Token0 & Token1 after redeem-------------------------')
  let token0Amount= await getERC20Balance(provider,wallet.address,token0.address)
  console.log(`WETH balance: ${token0Amount}`);
  let token1Amount= await getERC20Balance(provider,wallet.address,token1.address)
  console.log(`USDT balance: ${token1Amount}`);
  console.log('---------------------------------------------')
  console.log('-------------------------Test end-----------------------------------')

  
  //Recover Forking chain stats
  let USDTAmount = +await getERC20Balance(provider,wallet2.address,token1.address)
  USDTAmount = USDTAmount/Math.pow(10,token1.decimals)
  console.log(USDTAmount)
  const uncheckedTradeUSDT = await createTrade(USDTAmount, token1, token0, FeeAmount.MEDIUM, provider)
  const swapOutput = await executeTrade(uncheckedTradeUSDT, token1, provider, wallet2)
  // need to handle tx fail
  //construct position for testing
  receipt = await swapWETH(100, provider,wallet1)
          // need to handle tx fail
  InitializeAutomationStatsCV(wallet1.address.substring(0,5),TokenPair.ETHTether,FeeLevel.LOW)
  currentAutomationInfo = await readAutomationStats(wallet1.address.substring(0,5))
  currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV = AutomationState.Executing_DepositLQ
  await writeAutomationStats(currentAutomationInfo,wallet1.address.substring(0,5))
  await AutoDepositCV(0.01,0.01,provider,wallet1)
  
  //Get 8000 ETH equals value of USDT from 3000 fee pool || use wallet3
  receipt = await swapWETH(2100, provider, wallet3)
          // need to handle tx fail
  const uncheckedTrade = await createTrade(2100, token0, token1, FeeAmount.MEDIUM, provider)
  const receipt1 = await executeTrade(uncheckedTrade, token0, provider, wallet3)
  // need to handle tx fail
  token1Amount= await getERC20Balance(provider,wallet3.address,token1.address)
  console.log(token1Amount)
  
  //while-loop swap in USDT until pool price hit PriceUpper
  currentAutomationInfo = await readAutomationStats(wallet1.address.substring(0,5))
  const tickUpper = currentAutomationInfo.CURRENT_LQ_RANGE_UPPER_CV
  const swapUSDTAmount = 1000000
  poolInfo = await getPoolInfo(token0,token1,FeeAmount.LOW,provider)
  while(poolInfo.tick < tickUpper){
    console.log('loooooooooooooooooooooooooping')
    const uncheckedTrade = await createTrade(swapUSDTAmount, token1, token0, FeeAmount.LOW, provider)
    const swapOutput = await executeTrade(uncheckedTrade, token1, provider, wallet3)
    // need to handle tx fail
    poolInfo = await getPoolInfo(token0,token1,FeeAmount.LOW,provider)
    const priceAfterSwap = tickToPriceRealWorld(poolInfo.tick, CurrentConfig.tokensETHTether.token0,
      CurrentConfig.tokensETHTether.token1)
    console.log(`tick after: ${poolInfo.tick}`);
    console.log(`price after: ${priceAfterSwap}`);
    //check position Info in pool and position Info in local Json file
    //inside the while-loop position should not be closed
    await AutoRedeemCV(provider,wallet1)
    positionStats = await getPositionInfo(currentAutomationInfo.CONSERVATIVE_POSITION_ID,provider)
    //console.log(positionStats)
    currentAutomationInfo = await readAutomationStats(wallet1.address.substring(0,5))
    console.log(currentAutomationInfo)      
  }
  //check position Info in pool and position Info in local Json file
  //Position should be closed after the while-loop
  await AutoRedeemCV(provider,wallet1)
  positionStats = await getPositionInfo(currentAutomationInfo.CONSERVATIVE_POSITION_ID,provider)
  console.log(positionStats)
  currentAutomationInfo = await readAutomationStats(wallet1.address.substring(0,5))
  console.log(currentAutomationInfo)
  console.log('Price hit Price Upper')
  console.log('---------------Token0 & Token1 after redeem-------------------------')
  token0Amount= await getERC20Balance(provider,wallet.address,token0.address)
  console.log(`WETH balance: ${token0Amount}`);
  token1Amount= await getERC20Balance(provider,wallet.address,token1.address)
  console.log(`USDT balance: ${token1Amount}`);
  console.log('---------------------------------------------')
  console.log('-------------------------Test end-----------------------------------')
}

  // AutoDepositCV function are used for providing liquidity for 500 fee Uniswap pool
async function AutoDepositCVTest(){
  let positionStats
  //Testing chain initializing
  const provider= getForkingChainProvider()
  const wallet = createForkingChainWallet()
  //create a clean Automation stats
  InitializeAutomationStatsCV(wallet.address.substring(0,5),TokenPair.ETHTether,FeeLevel.LOW)
  let AutomationStats = await readAutomationStats(wallet.address.substring(0,5))
  //pausing executing deposit
  AutomationStats.CURRENT_AUTOMATION_STATE_CV = AutomationState.Waiting_DepositLQ
  const receipt = await swapWETH(100, provider,wallet)
          // need to handle tx fail
  await writeAutomationStats(AutomationStats,wallet.address.substring(0,5)).then((value)=>{AutoDepositCV(0.07,0.05,provider,wallet)})
  AutomationStats = await readAutomationStats(wallet.address.substring(0,5))
  console.log(AutomationStats)
  positionStats = await getPositionInfo(AutomationStats.CONSERVATIVE_POSITION_ID,provider)
  //Check position status || not position minted
  console.log(positionStats)
  console.log(AutomationStats)


  //Allow executing deposit
  AutomationStats.CURRENT_AUTOMATION_STATE_CV = AutomationState.Executing_DepositLQ
  await writeAutomationStats(AutomationStats,wallet.address.substring(0,5))
  await AutoDepositCV(0.07,0.05,provider,wallet)
  AutomationStats = await readAutomationStats(wallet.address.substring(0,5))
  positionStats = await getPositionInfo(AutomationStats.CONSERVATIVE_POSITION_ID,provider)
  //Check position status || position minted
  console.log(positionStats)
  console.log(AutomationStats)
}


//AutoDepositCVTest()
AutoRedeemCVTest()