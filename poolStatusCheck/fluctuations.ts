import fetch from 'cross-fetch'

async function queryPriceRange(poolID: string){
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
                poolDayData(orderDirection: desc, first: $timeSpan, orderBy: date) {
                    date
                    low
                    high
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
        calculate(result.data.pool.poolDayData)
    });
}
function calculate(arr: Array<any>){
    let i = 0;
    let highP = 0;
    let lowP = 1000000000
    while (i < arr.length) {
        lowP = Math.min(1/Number(arr[i].high), lowP)
        highP = Math.max(1/Number(arr[i].low), highP)
        i++;
    }
    console.log(`highest price in 30 days: ${highP.toFixed(0)}`)
    console.log(`lowest price in 30 days: ${lowP.toFixed(0)}`)
    console.log(`middle price in 30 days: ${((lowP+highP)/2).toFixed(0)}`)
    console.log(`range in 30 days: ${((highP-lowP)/(lowP+highP)).toFixed(4)}`)
}


queryPriceRange("0x11b815efb8f581194ae79006d24e0d814b7697f6")