import { ethers } from 'ethers'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { ERC20_ABI, POOL_FACTORY_CONTRACT_ADDRESS } from './constants'
import { getForkingChainProvider } from './providers'
import { computePoolAddress,FeeAmount} from '@uniswap/v3-sdk'
import { Token } from '@uniswap/sdk-core'
import { BaseProvider } from '@ethersproject/providers'

export interface PoolInfo {
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  sqrtPriceX96: ethers.BigNumber
  liquidity: ethers.BigNumber
  tick: number
  feeGrowthGlobal0X128: ethers.BigNumber
  feeGrowthGlobal1X128: ethers.BigNumber
  tickInfo: TickInfo
}

export interface TickInfo {
  liquidityGross: ethers.BigNumber
  liquidityNet: ethers.BigNumber
  feeGrowthOutside0X128: ethers.BigNumber
  feeGrowthOutside1X128: ethers.BigNumber
  tickCumulativeOutside: ethers.BigNumber
  secondsPerLiquidityOutsideX128: ethers.BigNumber
  secondsOutside: number
  initialized: boolean
}

export interface PoolBalance {
  token0Balance: number
  token1Balance: number
}

export async function getPoolInfo(token0Info: Token, token1Info: Token, poolFee: FeeAmount,provider:BaseProvider): Promise<PoolInfo> {
  if (!provider) {
    throw new Error('No provider')
  }

  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: token0Info,
    tokenB: token1Info,
    fee: poolFee,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  )
  

  const [token0, token1, fee, tickSpacing, liquidity, slot0,feeGrowthGlobal0X128, feeGrowthGlobal1X128, tickInfo] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
      poolContract.feeGrowthGlobal0X128(),
      poolContract.feeGrowthGlobal1X128(),
      poolContract.ticks(-202100),
    ])

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
    feeGrowthGlobal0X128,
    feeGrowthGlobal1X128,
    tickInfo
  }
}

export async function getTickInfo(tick: number, token0Info: Token, token1Info: Token, poolFee: FeeAmount, provider:BaseProvider): Promise<TickInfo> {
  if (!provider) {
    throw new Error('No provider')
  }

  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: token0Info,
    tokenB: token1Info,
    fee: poolFee,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  )

  const [tickInfo] =
    await Promise.all([
      poolContract.ticks(tick),
    ])
  return tickInfo
}

export async function getPoolBalance(token0Info: Token, token1Info: Token, poolFee: FeeAmount, provider:BaseProvider): Promise<PoolBalance> {
  if (!provider) {
    throw new Error('No provider')
  }

  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: token0Info,
    tokenB: token1Info,
    fee: poolFee,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  )
  const token0Contract = new ethers.Contract(
    token0Info.address,
    ERC20_ABI,
    provider
  )
  const token1Contract = new ethers.Contract(
    token1Info.address,
    ERC20_ABI,
    provider
  )
  console.log(poolContract.address)
  const token0Balance: number= await token0Contract.balanceOf(poolContract.address)
  const token1Balance: number = await token1Contract.balanceOf(poolContract.address)
  
  return {token0Balance, token1Balance}
}