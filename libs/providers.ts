import { ethers, providers, BigNumber } from 'ethers'
import { Environment, CurrentConfig } from '../tokens.config'
import { BaseProvider } from '@ethersproject/providers'

// Single copies of provider and wallet
const mainnetProvider = new ethers.providers.InfuraProvider()
const forkingChainProvider = new ethers.providers.JsonRpcProvider(
  'http://127.0.0.1:8545'
)
let walletExtensionAddress: string | null = null

// Interfaces

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent',
  NotRequired = 'NotRequired'
}

// Provider and Wallet Functions

export function getForkingChainProvider(): BaseProvider {
  return forkingChainProvider
}
export function getMainNetProvider(): BaseProvider {
  return mainnetProvider
}

export function createMainNetWallet(): ethers.Wallet {
  let provider = getMainNetProvider()
  return new ethers.Wallet(CurrentConfig.wallet.privateKey, provider)
}

export function createForkingChainWallet(): ethers.Wallet {
  let provider = getForkingChainProvider()
  return new ethers.Wallet(CurrentConfig.wallet.privateKey, provider)
}
export function createForkingChainWallet1(): ethers.Wallet {
  let provider = getForkingChainProvider()
  return new ethers.Wallet(CurrentConfig.wallet1.privateKey, provider)
}
export function createForkingChainWallet2(): ethers.Wallet {
  let provider = getForkingChainProvider()
  return new ethers.Wallet(CurrentConfig.wallet2.privateKey, provider)
}


export async function sendTransaction(
  transaction: ethers.providers.TransactionRequest,
  provider: BaseProvider,
  wallet: ethers.Wallet
): Promise<TransactionState> {
  //web3.eth.getBlock("pending").then((block) => console.log(block.baseFeePerGas));
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value)
  }
  const txRes = await wallet.sendTransaction(transaction)
  //console.log(`sending tx with nonce: ${txRes.nonce}`)
  //console.log(`maxPriorityFeePerGas: ${txRes.maxPriorityFeePerGas}`)
  //console.log(`maxFeePerGas: ${txRes.maxFeePerGas}`)
  //console.log(`gasLimit: ${txRes.gasLimit}`)
  let receipt
  if (!provider) {
    return TransactionState.Failed
  }

  while (receipt === undefined || receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash)
      //console.log(receipt)
    } catch (e) {
      console.log(`Receipt error:`, e)
      break
    }
  }
  
  // Transaction was successful if status === 1
  if (receipt) {
    if(receipt.status==0) {
      console.log('!!!!!!!!!!!!!!!!transaction failed')
      return TransactionState.Failed
    } else{
      //console.log('transaction succeed!!!!!!!!!!!!!!!')
      //console.log(`gasUsed: ${receipt.gasUsed}`)
      //console.log(`effectiveGasPrice: ${receipt.effectiveGasPrice}`)
      return TransactionState.Sent
    }
  } else {
    console.log(`no receipt yet, tx hash is: ${txRes.hash}`);
    return TransactionState.Failed
  }
}

export async function sendTransactionAddLQ(
  transaction: ethers.providers.TransactionRequest,
  provider: BaseProvider,
  wallet: ethers.Wallet
): Promise<number> {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value)
  }
  const txRes = await wallet.sendTransaction(transaction)
  //console.log(txRes);
  let receipt
  if (!provider) {
    return -1
  }
  while (receipt === undefined || receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash)
      
    } catch (e) {
      console.log(`Receipt error:`, e)
      break
    }
  }
  
  // Transaction was successful if status === 1
  if (receipt) {
    //console.log(`!!!!!!!!!!!!getting receipt at: ${receipt.blockNumber}`);
    const logs = receipt.logs
    const lenofLogs = logs.length
    
    if(lenofLogs != 0) {
      for (let i = 0; i < lenofLogs; i++) {
        const topic = logs[i].topics
        const lenofTopics = topic.length
        if(lenofTopics == 0) {
          continue
        }
        if(topic[0] == "0x3067048beee31b25b2f1681f88dac838c8bba36af25bfb2b7cf7473a5847e35f"){
          return parseInt(topic[1].toString())
        }
      }
    }
    
    return 1
  } else {
    console.log(`no receipt yet, tx hash is: ${txRes.hash}`);
    return -1
  }
}

export function getWalletAddress(  wallet: ethers.Wallet): string{
  return wallet.address
}
