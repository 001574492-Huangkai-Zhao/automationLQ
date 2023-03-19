amounts1 = 0
liquidity = 0
slot0 = contract.functions.slot0().call()
sqrtPriceCurrent = slot0[0] / (1 << 96)


def calculate_token0_amount(liquidity, sp, sa, sb):
    sp = max(min(sp, sb), sa)
    return liquidity * (sb - sp) / (sp * sb)


def calculate_token1_amount(liquidity, sp, sa, sb):
    sp = max(min(sp, sb), sa)
    return liquidity * (sp - sa)


for tick in range(MIN_TICK, MAX_TICK, TICK_SPACING):
    tickRange = Tick(*contract.functions.ticks(tick).call())
    liquidity += tickRange.liquidityNet
    sqrtPriceLow = 1.0001 ** (tick // 2)
    sqrtPriceHigh = 1.0001 ** ((tick + TICK_SPACING) // 2)
    amounts0 += calculate_token0_amount(liquidity,
                                        sqrtPriceCurrent, sqrtPriceLow, sqrtPriceHigh)
    amounts1 += calculate_token1_amount(liquidity,
                                        sqrtPriceCurrent, sqrtPriceLow, sqrtPriceHigh)

# for better output, should correct for the amount of decimals before printing
print(amounts0, amounts1)
