import { readFileSync,writeFileSync} from 'fs';
import dotenv from "dotenv";
export interface AutomationInfo {
    CURRENT_LQ_RANGE_LOWER_CV: number
    CURRENT_LQ_RANGE_UPPER_CV: number
    CURRENT_LQ_AMOUNT_CV: number
    CURRENT_LQ_RANGE_LOWER_AG: number
    CURRENT_LQ_RANGE_UPPER_AG: number
    CURRENT_LQ_AMOUNT_AG: number
    CURRENT_AUTOMATION_STATE_CV: String
    CURRENT_AUTOMATION_STATE_AG: String
    CONSERVATIVE_POSITION_ID: number
    AGGRESSIVE_POSITION_ID: number
  }
export async function writeEnv(automationInfo:AutomationInfo){
    let contentToWrite = 'CURRENT_LQ_RANGE_LOWER_CV='+automationInfo.CURRENT_LQ_RANGE_LOWER_CV+'\n'
    contentToWrite+= 'CURRENT_LQ_RANGE_UPPER_CV='+automationInfo.CURRENT_LQ_RANGE_UPPER_CV+'\n'
    contentToWrite+= 'CURRENT_LQ_AMOUNT_CV='+automationInfo.CURRENT_LQ_AMOUNT_CV+'\n'
    contentToWrite+= 'CURRENT_LQ_RANGE_LOWER_AG='+automationInfo.CURRENT_LQ_RANGE_LOWER_AG+'\n'
    contentToWrite+= 'CURRENT_LQ_RANGE_UPPER_AG='+automationInfo.CURRENT_LQ_RANGE_UPPER_AG+'\n'
    contentToWrite+= 'CURRENT_LQ_AMOUNT_AG='+automationInfo.CURRENT_LQ_AMOUNT_AG+'\n'
    contentToWrite+= 'CURRENT_AUTOMATION_STATE_CV='+automationInfo.CURRENT_AUTOMATION_STATE_CV+'\n'
    contentToWrite+= 'CURRENT_AUTOMATION_STATE_AG='+automationInfo.CURRENT_AUTOMATION_STATE_AG+'\n'
    contentToWrite+= 'CONSERVATIVE_POSITION_ID='+automationInfo.CONSERVATIVE_POSITION_ID+'\n'
    contentToWrite+= 'AGGRESSIVE_POSITION_ID='+automationInfo.AGGRESSIVE_POSITION_ID+'\n'
    writeFileSync('./.env', contentToWrite);
}

export async function readEnv(): Promise<AutomationInfo>{
  dotenv.config()
  let automationInfo: AutomationInfo
  if(
    process.env.CURRENT_LQ_RANGE_LOWER_CV
    &&process.env.CURRENT_LQ_RANGE_UPPER_CV
    &&process.env.CURRENT_LQ_AMOUNT_CV
    &&process.env.CURRENT_LQ_RANGE_LOWER_AG
    &&process.env.CURRENT_LQ_RANGE_UPPER_AG
    &&process.env.CURRENT_LQ_AMOUNT_AG
    &&process.env.CURRENT_AUTOMATION_STATE_AG
    &&process.env.CURRENT_AUTOMATION_STATE_CV
    &&process.env.CONSERVATIVE_POSITION_ID
    &&process.env.AGGRESSIVE_POSITION_ID){
    automationInfo = {
      CURRENT_LQ_RANGE_LOWER_CV:+process.env.CURRENT_LQ_RANGE_LOWER_CV,
      CURRENT_LQ_RANGE_UPPER_CV: +process.env.CURRENT_LQ_RANGE_UPPER_CV,
      CURRENT_LQ_AMOUNT_CV:+process.env.CURRENT_LQ_AMOUNT_CV,
      CURRENT_LQ_RANGE_LOWER_AG: +process.env.CURRENT_LQ_RANGE_LOWER_AG,
      CURRENT_LQ_RANGE_UPPER_AG:+process.env.CURRENT_LQ_RANGE_UPPER_AG,
      CURRENT_LQ_AMOUNT_AG:+process.env.CURRENT_LQ_AMOUNT_AG,
      CURRENT_AUTOMATION_STATE_CV:process.env.CURRENT_AUTOMATION_STATE_CV,
      CURRENT_AUTOMATION_STATE_AG:process.env.CURRENT_AUTOMATION_STATE_AG,
      CONSERVATIVE_POSITION_ID:+process.env.CONSERVATIVE_POSITION_ID,
      AGGRESSIVE_POSITION_ID:+process.env.AGGRESSIVE_POSITION_ID
    }
  }
  else{
    automationInfo = {
      CURRENT_LQ_RANGE_LOWER_CV:0.0,
      CURRENT_LQ_RANGE_UPPER_CV: 0.0,
      CURRENT_LQ_AMOUNT_CV:0.0,
      CURRENT_LQ_RANGE_LOWER_AG: 0.0,
      CURRENT_LQ_RANGE_UPPER_AG:0.0,
      CURRENT_LQ_AMOUNT_AG:0.0,
      CURRENT_AUTOMATION_STATE_CV:'',
      CURRENT_AUTOMATION_STATE_AG:'',
      CONSERVATIVE_POSITION_ID:0,
      AGGRESSIVE_POSITION_ID:0
  }
  }
  return automationInfo
}
