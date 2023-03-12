export const MaxPriceTolerance = 0.05
export enum AutomationState {
    Price_hit_TickLower  = 'Price_hit_TickLower',
    Price_hit_TickUpper = 'Price_hit_TickLower',
    Price_in_Range = 'Price_hit_TickLower',
    Waiting_for_DepositLQ = 'Waiting_for_DepositLQ',
    OraclePrice_gt_MaxPriceTolerance = 'OraclePrice_gt_MaxPriceTolerance',
    PoolInRangeLQ_lt_MaxLQTolerance = 'PoolInRangeLQ_lt_MaxLQTolerance'
  }
export enum StrategyType {
    Conservative  = 'Conservative',
    Aggressive = 'Aggressive',
    ULTDynamic = 'ULTDynamic',
    StandardResetting = 'StandardResetting',
    Sent = 'Sent',
    NotRequired = 'NotRequired'
  }
  