import { readFileSync,writeFileSync} from 'fs';
import dotenv from "dotenv";
export interface AutomationInfo {
    CURRENT_LQ_RANGE_LEFT_CV: number
    CURRENT_LQ_RANGE_RIGHT_CV: number
    CURRENT_LQ_AMOUNT_CV: number
    CURRENT_LQ_RANGE_LEFT_AG: number
    CURRENT_LQ_RANGE_RIGHT_AG: number
    CURRENT_LQ_AMOUNT_AG: number
    CURRENT_AUTOMATION_STATE_CV: String
    CURRENT_AUTOMATION_STATE_AG: String
    CONSERVATIVE_POSITION_ID: String
    AGGRESSIVE_POSITION_ID: String
  }
export async function writeEnv(automationInfo:AutomationInfo){
    let contentToWrite = 'CURRENT_LQ_RANGE_LEFT_CV='+automationInfo.CURRENT_LQ_RANGE_LEFT_CV+'\n'
    contentToWrite+= 'CURRENT_LQ_RANGE_RIGHT_CV='+automationInfo.CURRENT_LQ_RANGE_RIGHT_CV+'\n'
    contentToWrite+= 'CURRENT_LQ_AMOUNT_CV='+automationInfo.CURRENT_LQ_AMOUNT_CV+'\n'
    contentToWrite+= 'CURRENT_LQ_RANGE_LEFT_AG='+automationInfo.CURRENT_LQ_RANGE_LEFT_AG+'\n'
    contentToWrite+= 'CURRENT_LQ_RANGE_RIGHT_AG='+automationInfo.CURRENT_LQ_RANGE_RIGHT_AG+'\n'
    contentToWrite+= 'CURRENT_LQ_AMOUNT_AG='+automationInfo.CURRENT_LQ_AMOUNT_AG+'\n'
    contentToWrite+= 'CURRENT_AUTOMATION_STATE_CV='+automationInfo.CURRENT_AUTOMATION_STATE_CV+'\n'
    contentToWrite+= 'CURRENT_AUTOMATION_STATE_AG='+automationInfo.CURRENT_AUTOMATION_STATE_AG+'\n'
    contentToWrite+= 'CONSERVATIVE_POSITION_ID='+automationInfo.CONSERVATIVE_POSITION_ID+'\n'
    contentToWrite+= 'AGGRESSIVE_POSITION_ID='+automationInfo.AGGRESSIVE_POSITION_ID+'\n'
    writeFileSync('./.env', contentToWrite);
}

export async function readEnv(): Promise<AutomationInfo|undefined>{
  dotenv.config()
  let automationInfo: AutomationInfo
  if(
    process.env.CURRENT_LQ_RANGE_LEFT_CV
    &&process.env.CURRENT_LQ_RANGE_RIGHT_CV
    &&process.env.CURRENT_LQ_AMOUNT_CV
    &&process.env.CURRENT_LQ_RANGE_LEFT_AG
    &&process.env.CURRENT_LQ_RANGE_RIGHT_AG
    &&process.env.CURRENT_LQ_AMOUNT_AG
    &&process.env.CURRENT_AUTOMATION_STATE_AG
    &&process.env.CURRENT_AUTOMATION_STATE_CV
    &&process.env.CONSERVATIVE_POSITION_ID
    &&process.env.AGGRESSIVE_POSITION_ID){
    automationInfo = {
      CURRENT_LQ_RANGE_LEFT_CV:+process.env.CURRENT_LQ_RANGE_LEFT_CV,
      CURRENT_LQ_RANGE_RIGHT_CV: +process.env.CURRENT_LQ_RANGE_RIGHT_CV,
      CURRENT_LQ_AMOUNT_CV:+process.env.CURRENT_LQ_AMOUNT_CV,
      CURRENT_LQ_RANGE_LEFT_AG: +process.env.CURRENT_LQ_RANGE_LEFT_AG,
      CURRENT_LQ_RANGE_RIGHT_AG:+process.env.CURRENT_LQ_RANGE_RIGHT_AG,
      CURRENT_LQ_AMOUNT_AG:+process.env.CURRENT_LQ_AMOUNT_AG,
      CURRENT_AUTOMATION_STATE_CV:process.env.CURRENT_AUTOMATION_STATE_CV,
      CURRENT_AUTOMATION_STATE_AG:process.env.CURRENT_AUTOMATION_STATE_AG,
      CONSERVATIVE_POSITION_ID:process.env.CONSERVATIVE_POSITION_ID,
      AGGRESSIVE_POSITION_ID:process.env.AGGRESSIVE_POSITION_ID
    }
    return automationInfo
  }
}
