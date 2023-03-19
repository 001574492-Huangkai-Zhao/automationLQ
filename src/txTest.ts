
import { ethers,BigNumber } from 'ethers'
import{createTradeEXACT_OUTPUT, getOutputQuote, swapWETH} from '../libs/trading'
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
import {getForkingChainProvider,getMainNetProvider,createForkingChainWallet, TransactionState} from '../libs/providers'
import {AutomationState,MaxPriceTolerance} from '../src/automationConstants'
import { CurrentConfig } from '../tokens.config'
import {createTrade,executeTrade} from '../libs/trading'
import { getERC20Balance } from '../libs/balance'

async function swapInETHTest(
    token0: Token,
    token1: Token,
    poolFee: FeeAmount,
    range: number
){
    const swapEthAmount = 5000
    const provider = getForkingChainProvider()
    const wallet = createForkingChainWallet()
    const walletAddress = wallet.address
    const receipt = await swapWETH(900, provider, wallet)
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

    console.log();

    const uncheckedTrade = await createTrade(swapEthAmount, token0, token1, FeeAmount.LOW, provider)
    const swapOutput = await executeTrade(uncheckedTrade, token0, provider, wallet)
    if(swapOutput == TransactionState.Failed) {
        console.log('swap failed, please chack out the reason')
        return
    }
    const poolInfo = await getPoolInfo(token0,token1,poolFee,provider)
    const priceAfterSwap = tickToPriceRealWorld(poolInfo.tick, CurrentConfig.tokensETHTether.token0,
      CurrentConfig.tokensETHTether.token1)
    console.log(`tick after: ${poolInfo.tick}`);
    console.log(`price after: ${priceAfterSwap}`);
}



async function sgetTXStatusTest(hash: string){
    const swapEthAmount = 500
    const provider = getForkingChainProvider()
    const wallet = createForkingChainWallet()
    const walletAddress = wallet.address
    let receipt
    if (!provider) {
        return
    }
    console.log('receipt')
    while (receipt === undefined || receipt === null) {
        try {
        receipt = await provider.getTransactionReceipt(hash)
        console.log(receipt)
        } catch (e) {
        console.log(`Receipt error:`, e)
        break
        }
    }
    
    // Transaction was successful if status === 1
    if (receipt) {
        //console.log(`!!!!!!!!!!!!getting receipt at: ${receipt.blockNumber}`);
        return 
    } else {
        console.log(`no receipt yet, tx hash is: ${hash}`);
        return 
    }
}
swapInETHTest(CurrentConfig.tokensETHTether.token0, CurrentConfig.tokensETHTether.token1,FeeAmount.LOW, 0.1)
//sgetTXStatusTest('0xa53689eadef4efd339c4a62969941ed6148e64784aea6a50eabe1d2b4a1790c2')
//sgetTXStatusTest('0x07fe89e9fe588e4222e2ad018c1b04c930dc443225463c590ba86d25ab3f2f71')