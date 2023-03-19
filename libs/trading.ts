import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core'
import {
  FeeAmount,
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
  computePoolAddress
} from '@uniswap/v3-sdk'
import { ethers,BigNumber} from 'ethers'
import JSBI from 'jsbi'

import { CurrentConfig } from '../tokens.config'
import {
  ERC20_ABI,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  WETH_ABI,
  WETH_TOKEN,
} from './constants'
import { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS,} from './constants'
import { getPoolInfo } from './pool'
import {
  getWalletAddress,
  sendTransaction,
  TransactionState,
} from './providers'
import { fromReadableAmount } from './utils'
import { BaseProvider } from '@ethersproject/providers'

export type TokenTrade = Trade<Token, Token, TradeType>

// Trading Functions

export async function createTrade(amountIn:number,tokenIn: Token,tokenOut: Token, poolFee: FeeAmount,provider: BaseProvider): Promise<TokenTrade> {
  const poolInfo = await getPoolInfo(tokenIn,tokenOut,poolFee,provider)
  //console.log(`amount in: ${amountIn}`);
  const pool = new Pool(
    tokenIn,
    tokenOut,
    poolFee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  const swapRoute = new Route(
    [pool],
    tokenIn,
    tokenOut
  )

  const amountOut = await getOutputQuote(swapRoute,amountIn,tokenIn,provider)
  //console.log(`quote amountOut: ${amountOut}`)

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      tokenIn,
      fromReadableAmount(
        amountIn,
        tokenIn.decimals
      ).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      tokenOut,
      JSBI.BigInt(amountOut)
    ),
    tradeType: TradeType.EXACT_INPUT,
  })

  return uncheckedTrade
}

export async function executeTrade(
  trade: TokenTrade,
  tokenIn: Token,
  provider: BaseProvider,
  wallet: ethers.Wallet
): Promise<TransactionState> {
  const walletAddress = wallet.address

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  // Give approval to the router to spend the token
  const tokenApproval = await getTokenTransferApproval(tokenIn,provider,wallet)
  //console.log(`Give approval to the router result: ${tokenApproval}`)
  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent && tokenApproval !== TransactionState.NotRequired) {
    return TransactionState.Failed
  }
  
  const options: SwapOptions = {
    slippageTolerance: new Percent(5000, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress,
  }

  const methodParameters = SwapRouter.swapCallParameters([trade], options)
  //console.log(`method Parameters for swap execution: ${methodParameters}`);
  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    gasLimit: 999999,
  }

  const res = await sendTransaction(tx, provider, wallet)
  
  return res
}

// Helper Quoting and Pool Functions

export async function getOutputQuote(route: Route<Currency, Currency>,amountIn: number,tokenIn: Token,provider: BaseProvider) {

  if (!provider) {
    throw new Error('Provider required to get pool state')
  }

  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      tokenIn,
      fromReadableAmount(
        amountIn,
        tokenIn.decimals
      ).toString()
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  )

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS,
    data: calldata,
  })

  return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)
}

export async function getTokenTransferApproval(
  token: Token,
  provider: BaseProvider,
  wallet: ethers.Wallet
): Promise<TransactionState> {
  const address = wallet.address
  if (!provider || !address) {
    console.log('No Provider Found')
    return TransactionState.Failed
  }

  const tokenAmountToApprove = await checkTokenTransferApproval(token,provider,wallet)
  if(tokenAmountToApprove.lte(BigNumber.from('0x00'))){
    return TransactionState.NotRequired
  }

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      provider
    )

    const transaction = await tokenContract.populateTransaction.approve(
      SWAP_ROUTER_ADDRESS,
      tokenAmountToApprove
    )

    return sendTransaction(
    {
      ...transaction,
      from: address,
      gasLimit: 9999999
    },
    provider,
    wallet)
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}

export async function checkTokenTransferApproval(
  tokenToApprove: Token,
  provider: BaseProvider,
  wallet: ethers.Wallet
): Promise<BigNumber>{
  const tokenContract = new ethers.Contract(
    tokenToApprove.address,
    ERC20_ABI,
    provider
  )
  const _allowancesInfo = await tokenContract.allowance(wallet.address,SWAP_ROUTER_ADDRESS)
  //console.log(tokenToApprove);
  //console.log(`going to approve token amount: ${TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER.sub(_allowancesInfo)}`);
  return TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER.sub(_allowancesInfo)
}

export async function swapWETH(
  ethAmount: number,
  provider: BaseProvider,
  wallet: ethers.Wallet
): Promise<TransactionState> {
  const address = wallet.address
  if (!provider || !address) {
    console.log('No Provider Found')
    return TransactionState.Failed
  }
  const ethIn = ethers.utils.parseUnits(ethAmount.toString(),"ether")

  try {
    const tokenContract = new ethers.Contract(
      WETH_TOKEN.address,
      WETH_ABI,
      provider
    )

    const transaction = await tokenContract.populateTransaction.deposit()

    return sendTransaction(
    {
      ...transaction,
      from: address,
      to : WETH_TOKEN.address,
      value: ethIn,
    },
    provider,
    wallet)
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}

export async function createTradeEXACT_OUTPUT(amountOut:number, tokenIn: Token, tokenOut: Token, poolFee: FeeAmount,provider: BaseProvider): Promise<TokenTrade> {
  const poolInfo = await getPoolInfo(tokenIn,tokenOut,poolFee,provider)
  //console.log(poolInfo)
  
  const pool = new Pool(
    tokenIn,
    tokenOut,
    poolFee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  const swapRoute = new Route(
    [pool],
    tokenIn,
    tokenOut
  )

  const amountIn = await getOutputQuote(swapRoute,amountOut,tokenOut,provider)
  //console.log(`quote amountIn: ${amountIn}`)

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      tokenIn,
      JSBI.BigInt(amountIn)
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      tokenOut,
      fromReadableAmount(
        amountOut,
        tokenOut.decimals
      ).toString()
    ),
    tradeType: TradeType.EXACT_OUTPUT,
  })

  return uncheckedTrade
}

export async function getInputQuote(route: Route<Currency, Currency>,amountOut: number, tokenOut: Token, provider: BaseProvider) {

  if (!provider) {
    throw new Error('Provider required to get pool state')
  }

  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      tokenOut,
      fromReadableAmount(
        amountOut,
        tokenOut.decimals
      ).toString()
    ),
    TradeType.EXACT_OUTPUT,
    {
      useQuoterV2: true,
    }
  )

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS,
    data: calldata,
  })

  return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)
}



