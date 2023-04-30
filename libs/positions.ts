import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import {
  MintOptions,
  nearestUsableTick,
  NonfungiblePositionManager,
  Pool,
  Position,
  FeeAmount,
  CollectOptions,
  RemoveLiquidityOptions
} from '@uniswap/v3-sdk'
import { BigNumber, ethers } from 'ethers'
import {ERC20_ABI,MAX_FEE_PER_GAS,MAX_PRIORITY_FEE_PER_GAS,NONFUNGIBLE_POSITION_MANAGER_ABI,NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,} from './constants'
import { TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER } from './constants'
import { getPoolInfo,PoolInfo} from './pool'
import {sendTransaction,TransactionState,getWalletAddress,sendTransactionAddLQ} from './providers'
import{ getCurrencyBalance,getERC20Balance} from './balance'
import { BaseProvider } from '@ethersproject/providers'
import JSBI from 'jsbi'

export interface PositionInfo {
  tickLower: number
  tickUpper: number
  liquidity: BigNumber
  feeGrowthInside0LastX128: BigNumber
  feeGrowthInside1LastX128: BigNumber
  tokensOwed0: BigNumber
  tokensOwed1: BigNumber
}
export function tickToPrice(tick: number):number {
  return Math.pow(1.0001, tick);
}
export function tickToPriceRealWorld(tick: number, token0: Token, token1: Token):number {
  const poolPrice = Math.pow(1.0001, tick)
  return poolPrice*Math.pow(10, token0.decimals-token1.decimals)
}
export function tickToSqrtPrice(tick: number):number {
  return Math.pow(1.0001, tick/2);
}
export function sqrtPriceToTick(sqrtPrice: number):number {
  const tick =  Math.round(2*Math.log(sqrtPrice) / Math.log(1.0001))
  const remainder = tick % 10;
  return tick-remainder
}
export async function mintPosition(token0: Token, token1: Token, poolFee: FeeAmount,leftRange: number, rightRange: number ,provider: BaseProvider, wallet: ethers.Wallet): Promise<number> {
  const address = wallet.address
  if (!address || !provider) {
    return -1
  }

  // Give approval to the contract to transfer tokens
  const tokenInApproval = await getTokenTransferApproval(token0,provider,wallet)
  const tokenOutApproval = await getTokenTransferApproval(token1,provider,wallet)

  // Fail if transfer approvals do not go through
  if (
    tokenInApproval !== TransactionState.Sent && tokenInApproval !== TransactionState.NotRequired||
    tokenOutApproval !== TransactionState.Sent && tokenOutApproval !== TransactionState.NotRequired
  ) {
    return -1
  }
  //@@@
  const token0Amount = await getERC20Balance(provider,address,token0.address)
  const token1Amount = await getERC20Balance(provider,address,token1.address)
  const poolInfo = await getPoolInfo(token0,token1,poolFee,provider)   
  
  const positionToMint = await constructPosition(
    CurrencyAmount.fromRawAmount(
      token0,
      JSBI.BigInt(token0Amount)
    ),
    CurrencyAmount.fromRawAmount(
      token1,
      JSBI.BigInt(token1Amount)
    ),
    poolInfo,
    leftRange,
    rightRange
  )
  console.log(`positionToMint liquidity: ${positionToMint.liquidity}`)
  console.log(`positionToMint tickLower: ${positionToMint.tickLower}`)
  console.log(`positionToMint tickUpper: ${positionToMint.tickUpper}`)
  console.log(`positionToMint tickCurrent: ${positionToMint.pool.tickCurrent}`)
  console.log(`positionToMint liquidity total(before add LQ): ${positionToMint.pool.liquidity}`)

  const mintOptions: MintOptions = {
    recipient: address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  }

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    positionToMint,
    mintOptions
  )

  // build transaction
  const tx = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value: value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    gasLimit: 9999999
  }

  const res = await sendTransactionAddLQ(tx,provider,wallet)
  return res
}

export async function constructPosition(
  token0Amount: CurrencyAmount<Token>,
  token1Amount: CurrencyAmount<Token>,
  poolInfo: PoolInfo,
  leftRange: number,
  rightRange: number
): Promise<Position> {
  // get pool info

  // construct pool instance
  const configuredPool = new Pool(
    token0Amount.currency,
    token1Amount.currency,
    poolInfo.fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )
  const poolTick = poolInfo.tick
  const poolPrice = tickToPrice(poolTick);
  const sqrtprice = Math.pow(poolPrice, 0.5);
  const sqrtPriceUpper = sqrtprice * Math.pow((1+rightRange), 0.5);
  const sqrtPriceLower = sqrtprice * Math.pow((1-leftRange), 0.5);
  const tickUpper = sqrtPriceToTick(sqrtPriceUpper);
  const tickLower = sqrtPriceToTick(sqrtPriceLower);
  //const tickLower = sqrtPriceToTick(sqrtprice) -10;

  // create position using the maximum liquidity from input amounts
  //amount0: JSBI.BigInt(token0Amount),
  //amount1: token1Amount.quotient,
  console.log(`token0Amount to deposit: ${token0Amount.quotient}`)
  console.log(`token1Amount to deposit: ${token1Amount.quotient}`)
  return Position.fromAmounts({
    pool: configuredPool,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0: token0Amount.quotient,
    amount1: token1Amount.quotient,
    useFullPrecision: true,
  })
}

export async function getPositionIds(
  provider: BaseProvider,
  wallet: ethers.Wallet): Promise<number[]> {
  const address = wallet.address
  if (!provider || !address) {
    throw new Error('No provider available')
  }

  const positionContract = new ethers.Contract(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    NONFUNGIBLE_POSITION_MANAGER_ABI,
    provider
  )

  // Get number of positions
  const balance: number = await positionContract.balanceOf(address)

  // Get all positions
  const tokenIds : number[]= []
  for (let i = 0; i < balance; i++) {
    const tokenOfOwnerByIndex: number =
      await positionContract.tokenOfOwnerByIndex(address, i)
    tokenIds.push(tokenOfOwnerByIndex)
  }

  return tokenIds
}

export async function getPositionInfo(
  tokenId: number,
  provider: BaseProvider): Promise<PositionInfo> {
  if (!provider) {
    throw new Error('No provider available')
  }

  const positionContract = new ethers.Contract(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    NONFUNGIBLE_POSITION_MANAGER_ABI,
    provider
  )

  const position = await positionContract.positions(tokenId)

  return {
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    liquidity: position.liquidity,
    feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
    feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
    tokensOwed0: position.tokensOwed0,
    tokensOwed1: position.tokensOwed1,
  }
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
    //console.log('no need for approve')
    return TransactionState.NotRequired
  }

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      provider
    )

    const transaction = await tokenContract.populateTransaction.approve(
      NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
      tokenAmountToApprove
    )

    return sendTransaction(
    {
      ...transaction,
      from: address,
      gasLimit: 99999
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
  const _allowancesInfo = await tokenContract.allowance(wallet.address,NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS)
  const approve_amount = TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER.sub(_allowancesInfo)
  //console.log(`going to approve token amount: ${TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER.sub(_allowancesInfo)}`);
  return approve_amount
}


export async function removeLiquidity(
  token0: Token,
  token1: Token,
  poolFee: FeeAmount,
  provider: BaseProvider,
  wallet: ethers.Wallet,
  positionId: number
): Promise<TransactionState> {
  const address = wallet.address
  if (!address || !provider) {
    return TransactionState.Failed
  }
  //const token0Amount = await getERC20Balance(provider,address,token0.address)
  //const token1Amount = await getERC20Balance(provider,address,token1.address)
  //console.log(`token0Amount: ${token0Amount}`)
  //console.log(`token1Amount: ${token1Amount}`)
  const poolInfo = await getPoolInfo(token0,token1,poolFee,provider)   
  
  const currentPosition = await constructPositionForRedeem(
    CurrencyAmount.fromRawAmount(
      token0,
      JSBI.BigInt(0)
    ),
    CurrencyAmount.fromRawAmount(
      token1,
      JSBI.BigInt(0)
    ),
    poolInfo,
    positionId,provider
  )
  
  console.log(`liquidity to redeem: ${currentPosition.liquidity}`)
  const collectOptions: Omit<CollectOptions, 'tokenId'> = {
    expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(
      token0,
      0
    ),
    expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(
      token1,
      0
    ),
    recipient: address,
  }

  const fractionToRemove = 1;
  const removeLiquidityOptions: RemoveLiquidityOptions = {
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 100),
    tokenId: positionId,
    // percentage of liquidity to remove
    liquidityPercentage: new Percent(fractionToRemove),
    collectOptions,
  }

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
    currentPosition,
    removeLiquidityOptions
  )

  // build transaction
  const tx = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value: value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    gasLimit: 9999999
  }
  const res = await sendTransaction(tx,provider,wallet)
  return res
}

async function constructPositionForRedeem(
  token0Amount: CurrencyAmount<Token>,
  token1Amount: CurrencyAmount<Token>,
  poolInfo: PoolInfo,
  positionIndex: number,
  provider: BaseProvider,
): Promise<Position> {

  // construct pool instance
  const configuredPool = new Pool(
    token0Amount.currency,
    token1Amount.currency,
    poolInfo.fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick,
  )
  const posi_info = await getPositionInfo(positionIndex,provider)
  const tickLower = posi_info.tickLower
  const tickUpper = posi_info.tickUpper
  const LQ = JSBI.BigInt(posi_info.liquidity.toString())
  //const LQ_1 = JSBI.subtract(LQ,JSBI.BigInt(1))

  const psitinArg = {pool: configuredPool, liquidity: LQ, tickLower: tickLower, tickUpper: tickUpper}
  return new Position(psitinArg)
}