import { stringify } from 'csv-stringify';
import fs from 'fs'
import moment from 'moment';
export function arrayToCsv(data: object[]){
    const time = new Date()
    const dateString = moment(time).format('YYYY_MM_DD');
    let outputFileName = "out/" +dateString
    console.log(outputFileName)
    let columns = {
        price: 'price',
        LQ: 'liquidity'
    };

    stringify(data, { header: true, columns: columns }, (err, output) => {
        if (err) throw err;
        fs.writeFile(outputFileName, output, (err) => {
            if (err) throw err;
            console.log(`${outputFileName} saved.`)
        });
    });
}
