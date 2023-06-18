import fetch from 'cross-fetch'

async function queryTest(poolID: string){
    //revise timespan parameter to adust time span for average calculation, by defualt it's 30 days 
    let timeSpan = 30;
    fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        query: `
        query ETH_THT($poolID: String, $timeSpan: Int) {
            pool(id: $poolID) {
                feeTier
                token0 {
                    name
                }
                token1 {
                    name
                }
                liquidity
                poolDayData(orderDirection: desc, first: $timeSpan, orderBy: date) {
                    date
                    feesUSD
                    volumeUSD
                    liquidity
                }
            }
        }
        `,
        variables: {
            poolID: poolID,
            timeSpan: timeSpan,
        },
    }),
    })
    .then((res) => res.json())
    .then((result) => {
        console.log(result.data.pool.token0.name + " & "+ result.data.pool.token1.name + " "+ result.data.pool.feeTier);
        //console.log(`LQ: ${result.data.pool.liquidity}`);
        //
        console.log(`fee per LQ in a day: ${(Number(result.data.pool.poolDayData[1].feesUSD)/Number(result.data.pool.liquidity)*Math.pow(10,15)).toFixed(2)}`);
        let averageDailyFee = averageLQ(result.data.pool.poolDayData)
        console.log(`average daily fee per LQ: ${(averageFee(result.data.pool.poolDayData)/averageDailyFee*Math.pow(10,15)).toFixed(2)}`)
        console.log()
    });
}
function averageFee(arr: Array<any>): number{
    //skip the first data
    let i = 1;
    let feeSum = 0;
    while (i < arr.length) {
        feeSum += Number(arr[i].feesUSD);
        i++;
    }
    return feeSum/(arr.length-1);
}

function averageLQ(arr: Array<any>): number{
    let i = 1;
    let feeSum = 0;
    while (i < arr.length) {
        feeSum += Number(arr[i].liquidity);
        i++;
    }
    return feeSum/(arr.length-1);
}

queryTest("0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640")
    .then(() => {queryTest("0x11b815efb8f581194ae79006d24e0d814b7697f6")})
    .then(() => {queryTest("0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8")})
    .then(() => {queryTest("0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8")})
    .then(() => {queryTest("0x4e68ccd3e89f51c3074ca5072bbac773960dfa36")})
    .then(() => {queryTest("0x60594a405d53811d3bc4766596efd80fd545a270")})
    .then(() => {queryTest("0xc5af84701f98fa483ece78af83f11b6c38aca71d")})
    .then(() => {queryTest("0x7bea39867e4169dbe237d55c8242a8f2fcdcc387")})
