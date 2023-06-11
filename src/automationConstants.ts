export const MaxPriceTolerance = 0.05
export const AggressiveAssetRatio = 0.5
export const AsymmetryRatio = 0.01
export const LQStartRange = 0.1
export const FeeCollectionThreshold = 1600
export const ETHMarginForGasFee = 0.5
export enum AutomationState {
    Price_Hit_TickLower  = 'Price_hit_TickLower',
    Price_Hit_TickUpper = 'Price_hit_TickUpper',
    Price_In_Range = 'Price_In_Range',
    Waiting_DepositLQ = 'Waiting_for_DepositLQ',
    Executing_DepositLQ = 'Executing_DepositLQ',
    OraclePrice_GT_MaxPriceTolerance = 'OraclePrice_gt_MaxPriceTolerance',
    PoolInRangeLQ_LT_MaxLQTolerance = 'PoolInRangeLQ_lt_MaxLQTolerance',
    Automation_Paused_RevertedTX = 'Automation_paused_RevertedTX',
    Automation_Paused_PendingTX = 'Automation_paused_PendingTX',
    Automation_On = 'Automation_On',
    NoAction_Required = 'NoAction_Required'
  }
export enum StrategyType {
    Conservative  = 'Conservative',
    Aggressive = 'Aggressive',
    ULTDynamic = 'ULTDynamic',
    StandardResetting = 'StandardResetting',
    Sent = 'Sent',
    NotRequired = 'NotRequired'
  }

  export enum PositionType {
    Conservative  = 'Conservative',
    Aggressive = 'Aggressive',
  }
  
  