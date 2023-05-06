import{getERC20Balance} from '../libs/balance'
import{getPoolInfo} from '../libs/pool'
import{swapWETH} from '../libs/trading'
import { CurrentConfig } from '../tokens.config'
import {
    TransactionState,
  } from '../libs/providers'
  import {
    FeeAmount,
  } from '@uniswap/v3-sdk'
import {mintPosition,getPositionInfo,removeLiquidity} from '../libs/positions'
import { rebalanceTokens} from './tokenRebalancing'
import {AutomationState,} from './automationConstants'
import { BaseProvider } from '@ethersproject/providers'
import { ethers} from 'ethers'
import{readEnv,writeEnv} from './RWAutomationState'

export async function AutoRedeemCV(provider: BaseProvider,wallet: ethers.Wallet){
  let currentAutomationInfo = await readEnv()
  let positionID = currentAutomationInfo.CONSERVATIVE_POSITION_ID
  const token0 = CurrentConfig.tokensETHTether.token0
  const token1 = CurrentConfig.tokensETHTether.token1
  const poolFee = FeeAmount.LOW
  const poolInfo = await getPoolInfo(token0,token1, poolFee,provider)
  const currentTick = poolInfo.tick

  let automationState
  let redeemRes = TransactionState.Sent
  let posi_info = await getPositionInfo(positionID,provider)
  const tickLower = posi_info.tickLower
  const tickUpper = posi_info.tickUpper
  console.log(`position tickLower: ${tickLower}`)
  console.log(`position tickUpper: ${tickUpper}`)
  console.log(`position LQ: ${parseInt(posi_info.liquidity.toString())}`)
  if(posi_info.liquidity.eq(0)) {
    automationState = AutomationState.NoAction_Required
  }
  if(currentTick > tickUpper) {
    redeemRes = await removeLiquidity(token0,token1, FeeAmount.LOW,provider,wallet, positionID)
    console.log("current price hit Upper range, redeem as Tether")
    posi_info = await getPositionInfo(positionID,provider)
    console.log(`position LQ after redeem: ${parseInt(posi_info.liquidity.toString())}`)
    automationState = AutomationState.Price_Hit_TickUpper
  } else if(currentTick < tickLower) {
    redeemRes = await removeLiquidity(token0,token1, FeeAmount.LOW,provider,wallet, positionID)
    console.log("current price hit lower range, redeem as ETH")
    posi_info = await getPositionInfo(positionID,provider)
    console.log(`position LQ after redeem: ${parseInt(posi_info.liquidity.toString())}`)
    automationState = AutomationState.Price_Hit_TickLower
  } else{
    console.log("current price stay in range of this position, no need for redeem!!!!!!!!")
    automationState = AutomationState.Price_In_Range
  }
  console.log()

  const token0Amount_LQ = await getERC20Balance(provider,wallet.address,token0.address)
  const token1Amount_LQ = await getERC20Balance(provider, wallet.address,token1.address)
  console.log(`after redeem: ${token0Amount_LQ}`);
  console.log(`after redeem: ${token1Amount_LQ}`);
  currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV=automationState

  await writeEnv(currentAutomationInfo)
}

export async function AutoDepositCV(leftRange:number, rightRange:number,provider: BaseProvider,wallet: ethers.Wallet){
    let currentAutomationInfo = await readEnv()
    if(currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV == AutomationState.Price_In_Range 
      || currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV == AutomationState.Automation_Paused_PendingTX 
      || currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV== AutomationState.Automation_Paused_RevertedTX 
      || currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV == AutomationState.Waiting_DepositLQ 
      || currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV == AutomationState.NoAction_Required){
        return 
      }

    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
    const ETHBalance = provider.getBalance(wallet.address)
    await rebalanceTokens(provider, wallet, token0, token1, poolFee,leftRange, rightRange)
    const positinID = await mintPosition(token0,token1, poolFee, leftRange, rightRange, provider,wallet);
    console.log(`minted positio ID: ${positinID}`);
    console.log()
    if(positinID==-1||positinID==1){
      currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV = AutomationState.Automation_Paused_RevertedTX
      return
    }

    const positionInfo = await getPositionInfo(positinID,provider)
    currentAutomationInfo.CURRENT_LQ_RANGE_LOWER_CV = positionInfo.tickLower
    currentAutomationInfo.CURRENT_LQ_RANGE_UPPER_CV = positionInfo.tickUpper
    currentAutomationInfo.CURRENT_LQ_AMOUNT_CV = positionInfo.liquidity.toNumber()
    currentAutomationInfo.CONSERVATIVE_POSITION_ID = positinID
    currentAutomationInfo.CURRENT_AUTOMATION_STATE_CV = AutomationState.Price_In_Range
    const token0Amount_LQ = await getERC20Balance(provider,wallet.address,token0.address)
    const token1Amount_LQ = await getERC20Balance(provider, wallet.address,token1.address)

    //console.log(`after adding liquidity: ${token0Amount_LQ}`);
    //console.log(`after adding liquidity: ${token1Amount_LQ}`);
    await writeEnv(currentAutomationInfo)
}


/*
export async function AutoDepositAG(positionRange:number, provider: BaseProvider, wallet: ethers.Wallet){
    let currentAutomationInfo = await readEnv()
    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
    
    await rebalanceTokens(provider, wallet, token0, token1, poolFee, currentAutomationInfo.CURRENT_LQ_RANGE_LOWER_AG)
    const positinID = await mintPosition(token0,token1, poolFee, positionRange,provider,wallet);
    console.log(`minted positio ID: ${positinID}`);
    console.log()
    if(positinID==-1||positinID==1){
      currentAutomationInfo.CURRENT_AUTOMATION_STATE_AG = AutomationState.Automation_Paused_RevertedTX
      return
    }

    const positionInfo = await getPositionInfo(positinID,provider)
    currentAutomationInfo.CURRENT_LQ_RANGE_LOWER_AG = positionInfo.tickLower
    currentAutomationInfo.CURRENT_LQ_RANGE_UPPER_AG = positionInfo.tickUpper
    currentAutomationInfo.CURRENT_LQ_AMOUNT_AG = positionInfo.liquidity.toNumber()
    currentAutomationInfo.AGGRESSIVE_POSITION_ID = positinID
    currentAutomationInfo.CURRENT_AUTOMATION_STATE_AG = AutomationState.Price_In_Range
    const token0Amount_LQ = await getERC20Balance(provider,wallet.address,token0.address)
    const token1Amount_LQ = await getERC20Balance(provider, wallet.address,token1.address)
    await writeEnv(currentAutomationInfo)
    //console.log(`after adding liquidity: ${token0Amount_LQ}`);
    //console.log(`after adding liquidity: ${token1Amount_LQ}`);
}
*/
/*
export async function AutoDepositInitial(provider: BaseProvider, walletCV: ethers.Wallet, walletAG: ethers.Wallet){
    const token0 = CurrentConfig.tokensETHTether.token0
    const token1 = CurrentConfig.tokensETHTether.token1
    const poolFee = FeeAmount.LOW
    const receipt = await swapWETH(100, provider,wallet)
    await rebalanceTokens(provider, wallet, token0, token1, poolFee, positionRange)
    const positinID = await mintPosition(token0,token1, poolFee, positionRange, provider, wallet);
    console.log(`minted positio ID: ${positinID}`);
    console.log()
    const token0Amount_LQ = await getERC20Balance(provider,wallet.address,token0.address)
    const token1Amount_LQ = await getERC20Balance(provider, wallet.address,token1.address)
    //console.log(`after adding liquidity: ${token0Amount_LQ}`);
    //console.log(`after adding liquidity: ${token1Amount_LQ}`);
}
*/