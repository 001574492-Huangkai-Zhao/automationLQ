import { readFileSync,writeFileSync} from 'fs';
import dotenv from "dotenv";
import { string } from 'hardhat/internal/core/params/argumentTypes';
import { FeeLevel } from './automationConstants';
export interface AutomationInfo {
    WALLET_ADDRESS: String
    CURRENT_LQ_RANGE_LOWER_CV: number
    CURRENT_LQ_RANGE_UPPER_CV: number
    CURRENT_LQ_AMOUNT_CV: string
    CURRENT_LQ_RANGE_LOWER_AG: number
    CURRENT_LQ_RANGE_UPPER_AG: number
    CURRENT_LQ_AMOUNT_AG: number
    CURRENT_AUTOMATION_STATE_CV: String
    CURRENT_AUTOMATION_STATE_AG: String
    CONSERVATIVE_POSITION_ID: number
    AGGRESSIVE_POSITION_ID: number
    TOKEN_PAIR_CV : String
    TOKEN_PAIR_AG : String
    FEE_LEVEL_CV : String
    FEE_LEVEL_AG : String

  }
export async function writeAutomationStats(automationInfo:AutomationInfo,walletName:string){
    let contentToWrite = '{\n'
    contentToWrite+= '"WALLET_ADDRESS" :'+'"'+automationInfo.WALLET_ADDRESS+'"'+',\n'
    contentToWrite+= '"CURRENT_LQ_RANGE_LOWER_CV" :'+'"'+automationInfo.CURRENT_LQ_RANGE_LOWER_CV+'"'+',\n'
    contentToWrite+= '"CURRENT_LQ_RANGE_UPPER_CV" :'+'"'+automationInfo.CURRENT_LQ_RANGE_UPPER_CV+'"'+',\n'
    contentToWrite+= '"CURRENT_LQ_AMOUNT_CV" :'+'"'+automationInfo.CURRENT_LQ_AMOUNT_CV+'"'+',\n'
    contentToWrite+= '"CURRENT_LQ_RANGE_LOWER_AG" :'+'"'+automationInfo.CURRENT_LQ_RANGE_LOWER_AG+'"'+',\n'
    contentToWrite+= '"CURRENT_LQ_RANGE_UPPER_AG" :'+'"'+automationInfo.CURRENT_LQ_RANGE_UPPER_AG+'"'+',\n'
    contentToWrite+= '"CURRENT_LQ_AMOUNT_AG" :'+'"'+automationInfo.CURRENT_LQ_AMOUNT_AG+'"'+',\n'
    contentToWrite+= '"CURRENT_AUTOMATION_STATE_CV" :'+'"'+automationInfo.CURRENT_AUTOMATION_STATE_CV+'"'+',\n'
    contentToWrite+= '"CURRENT_AUTOMATION_STATE_AG" :'+'"'+automationInfo.CURRENT_AUTOMATION_STATE_AG+'"'+',\n'
    contentToWrite+= '"CONSERVATIVE_POSITION_ID" :'+'"'+automationInfo.CONSERVATIVE_POSITION_ID+'"'+',\n'
    contentToWrite+= '"AGGRESSIVE_POSITION_ID" :'+'"'+automationInfo.AGGRESSIVE_POSITION_ID+'"'+'\n'
    contentToWrite+= '"TOKEN_PAIR_CV" :'+'"'+automationInfo.TOKEN_PAIR_CV+'"'+'\n'
    contentToWrite+= '"TOKEN_PAIR_AG :'+'"'+automationInfo.TOKEN_PAIR_AG+'"'+'\n'
    contentToWrite+= '"FEE_LEVEL_CV" :'+'"'+automationInfo.FEE_LEVEL_CV+'"'+'\n'
    contentToWrite+= '"FEE_LEVEL_AG :'+'"'+automationInfo.FEE_LEVEL_AG+'"'+'\n'
    contentToWrite += '}\n'
    let fileName = './AutomationStats/AutomationStats_'
    fileName+= walletName
    writeFileSync(fileName, contentToWrite);
}



export async function InitializeAutomationStatsCV(walletName:string,tokenPair: string,feeLevel: string){
  let contentToWrite = '{\n'
  contentToWrite+= '"WALLET_ADDRESS" :'+'"null"'+',\n'
  contentToWrite+= '"CURRENT_LQ_RANGE_LOWER_CV" :'+'"0"'+',\n'
  contentToWrite+= '"CURRENT_LQ_RANGE_UPPER_CV" :'+'"0"'+',\n'
  contentToWrite+= '"CURRENT_LQ_AMOUNT_CV" :'+'"0"'+',\n'
  contentToWrite+= '"CURRENT_LQ_RANGE_LOWER_AG" :'+'"0"'+',\n'
  contentToWrite+= '"CURRENT_LQ_RANGE_UPPER_AG" :'+'"0"'+',\n'
  contentToWrite+= '"CURRENT_LQ_AMOUNT_AG" :'+'"0"'+',\n'
  contentToWrite+= '"CURRENT_AUTOMATION_STATE_CV" :'+'"null"'+',\n'
  contentToWrite+= '"CURRENT_AUTOMATION_STATE_AG" :'+'"null"'+',\n'
  contentToWrite+= '"CONSERVATIVE_POSITION_ID" :'+'"1"'+',\n'
  contentToWrite+= '"AGGRESSIVE_POSITION_ID" :'+'"1"'+'\n'
  contentToWrite+= '"TOKEN_PAIR_CV" :'+tokenPair+',\n'
  contentToWrite+= '"TOKEN_PAIR_AG" :'+feeLevel+',\n'
  contentToWrite+= '"FEE_LEVEL_CV" :'+'"null"'+',\n'
  contentToWrite+= '"FEE_LEVEL_AG" :'+'"null"'+',\n'
  contentToWrite += '}\n'
  let fileName = './AutomationStats/AutomationStats_'
  fileName+= walletName
  writeFileSync(fileName, contentToWrite)

}

export async function readAutomationStats(walletName:string): Promise<AutomationInfo>{
  const fileString = readFileSync('./AutomationStats/AutomationStats_'+walletName,'utf-8')
  const automationStats : AutomationInfo = JSON.parse(fileString)
  return automationStats
}

