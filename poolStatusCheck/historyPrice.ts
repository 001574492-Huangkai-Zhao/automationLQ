import fetch from 'cross-fetch'
import { arrayToCsv } from './writeCSV';

async function queryTest(poolID: string){
    let requestRes = await fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        query: `
        query price_diff($poolID: String) {
            pool(id: $poolID) {
                feeTier
                poolHourData(orderDirection: desc, orderBy: periodStartUnix, first: 1000) {
                    close
                    periodStartUnix
                }
            }
        }
        `,
        variables: {
            poolID: poolID,
        },
    }),
    })
    if(requestRes.status == 200){
        let requestJson =await requestRes.json()
        writeToFile(requestJson.data.pool.poolHourData, requestJson.data.pool.feeTier)
    }
}

function writeToFile(arr: Array<any>, feeLevel: string){
    let dataToCSV = []
    let i = 0;
    while (i < arr.length) {
        dataToCSV.push([ arr[i].periodStartUnix, " ",(1/arr[i].close).toFixed(0)]);
        i++;
    }
    dataToCSV.push([])
    arrayToCsv(dataToCSV)
}


async function queryPriceTest(){
    await queryTest("0x99ac8ca7087fa4a2a1fb6357269965a2014abc35")
    //await queryTest("0x4e68ccd3e89f51c3074ca5072bbac773960dfa36")
    //await queryTest("0xc5af84701f98fa483ece78af83f11b6c38aca71d")

}

queryPriceTest()