import csv from 'csv-parser'
import fs from 'fs';
import readline from 'readline';

export const requestToCSVConverter = async function requestToCSVConverter(audienceFilePath, sortByParameter, sortValueParameter) {
    try {
        let csvData = [];
        let isFirstLine = true;
        let isRankColumnExists = false;
        let csvFileWithRecords = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(audienceFilePath),
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            if (isFirstLine) {
                isFirstLine = false;
                continue;
            }
            const row = line.split(',');
            csvData.push(row);
        }


        if (sortByParameter.length > 0) {
            switch (sortByParameter) {
                case "AUD_ID":
                    const audIdSortingResponse = await sortTheAudienceFileForGiveSortFlagAndSortValue(csvData, sortValueParameter, 0)
                    isRankColumnExists = audIdSortingResponse.BooleanVal
                    csvFileWithRecords = audIdSortingResponse.ListVal
                    break;
                case "ACC_ID":
                    const accIdSortingResponse = await sortTheAudienceFileForGiveSortFlagAndSortValue(csvData, sortValueParameter, 1)
                    isRankColumnExists = accIdSortingResponse.BooleanVal
                    csvFileWithRecords = accIdSortingResponse.ListVal
                    break;
                case "SITE_ID":
                    const siteIdSortingResponse = await sortTheAudienceFileForGiveSortFlagAndSortValue(csvData, sortValueParameter, 2)
                    isRankColumnExists = siteIdSortingResponse.BooleanVal
                    csvFileWithRecords = siteIdSortingResponse.ListVal
                    break;
                case "SELLER_ID":
                    const sellerIdSortingResponse = await sortTheAudienceFileForGiveSortFlagAndSortValue(csvData, sortValueParameter, 3)
                    isRankColumnExists = sellerIdSortingResponse.BooleanVal
                    csvFileWithRecords = sellerIdSortingResponse.ListVal
                    break;
                case "RANK":
                    const rankSortingResponse = await sortTheAudienceFileForGiveSortFlagAndSortValue(csvData, sortValueParameter, 4)
                    isRankColumnExists = rankSortingResponse.BooleanVal
                    csvFileWithRecords = rankSortingResponse.ListVal
                    break;
                case "START_DATE":
                    const startDateSortingResponse = await sortTheAudienceFileForGiveSortFlagAndSortValue(csvData, sortValueParameter, 5)
                    isRankColumnExists = startDateSortingResponse.BooleanVal
                    csvFileWithRecords = startDateSortingResponse.ListVal
                    break;
                case "END_DATE":
                    const endDateSortingResponse = await sortTheAudienceFileForGiveSortFlagAndSortValue(csvData, sortValueParameter, 6)
                    isRankColumnExists = endDateSortingResponse.BooleanVal
                    csvFileWithRecords = endDateSortingResponse.ListVal
                    break;
            }
        } else {
            for (let i = 0; i <= csvData.length - 1; i++) {
                //Does not include a rank column
                if (csvData[i].length < 8) {
                    csvFileWithRecords.push({
                        audience_id: csvData[i][0],
                        account_id: csvData[i][1],
                        site_id: csvData[i][2],
                        seller_id: csvData[i][3],
                        supc: csvData[i][4],
                        rank: null,
                        start_date: csvData[i][5],
                        end_date: csvData[i][6],
                    });

                } else {
                    //Include a rank column
                    isRankColumnExists = true;
                    csvFileWithRecords.push({
                        audience_id: csvData[i][0],
                        account_id: csvData[i][1],
                        site_id: csvData[i][2],
                        seller_id: csvData[i][3],
                        supc: csvData[i][4],
                        rank: csvData[i][5],
                        start_date: csvData[i][6],
                        end_date: csvData[i][7],
                    });
                }
            }
        }

        if (isRankColumnExists) {
            csvFileWithRecords.sort((a, b) => {
                return parseInt(a.col5) - parseInt(b.col5);
            });
        }
        console.log(`size of the csv with file records are : ${csvFileWithRecords.length}`)
        fs.unlinkSync(audienceFilePath);
        return csvFileWithRecords;
    } catch (err) {
        console.log(`utils => requestToCSVConverter()=> Error occured ${err}`)
        fs.unlinkSync(audienceFilePath);
        return null;
    }
}


async function sortTheAudienceFileForGiveSortFlagAndSortValue(csvData, sortValueParameter, indexNumber) {
    try {
        let csvFileWithRecords = [];
        let isRankColumnExists = false;

        for (let i = 0; i <= csvData.length - 1; i++) {

            //Does not include a rank column
            if (csvData[i].length < 8) {
                if (csvData[i][indexNumber] == sortValueParameter) {
                    csvFileWithRecords.push({
                        audience_id: csvData[i][0],
                        account_id: csvData[i][1],
                        site_id: csvData[i][2],
                        seller_id: csvData[i][3],
                        supc: csvData[i][4],
                        rank: null,
                        start_date: csvData[i][5],
                        end_date: csvData[i][6],
                    });
                }
            } else {
                isRankColumnExists = true;
                //Include a rank column
                if (csvData[i][indexNumber] == sortValueParameter) {
                    csvFileWithRecords.push({
                        audience_id: csvData[i][0],
                        account_id: csvData[i][1],
                        site_id: csvData[i][2],
                        seller_id: csvData[i][3],
                        supc: csvData[i][4],
                        rank: csvData[i][5],
                        start_date: csvData[i][6],
                        end_date: csvData[i][7],
                    });
                }
            }
        }
        return {
            BooleanVal: isRankColumnExists,
            ListVal: csvFileWithRecords
        };

    } catch (err) {
        console.log(`utils => sortTheAudienceFileForGiveSortFlagAndSortValue()=> Error occured ${err}`)
        return null;
    }
}



export const requestToJsonConverter = async function requestToJsonConverter(filePath) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const results = jsonData?.data?.searchProductsV2?.results || [];
        const graphRequestDtos = results.map(record => {
            return {
                sellerId: record.sellerId || '',
                siteId: record.siteId || '',
                productId: record.productId || '',
                name: record.name || '',
                description: record.description || '',
                brand: record.brand || null,
                isOrderable: record.isOrderable || false
            };
        });

        fs.unlinkSync(filePath);
        return graphRequestDtos;

    } catch (err) {
        console.error(err);
        fs.unlinkSync(filePath);
        return null;
    }
}



export const customAudienceFileResponse = async function generateCustomAudienceFile(productListFromGraph, audIdList, accIdList, startDateList, endDateList) {
    try {
        console.log(`utils => generateCustomAudienceFile() => function invoked..`)
        const customAudienceFileList = []
        customAudienceFileList.push("audience_id,account_id,site_id,seller_id,supc,start_date,end_date\n")

        for (let i = 0; i <= productListFromGraph.length - 1; i++) {
            console.log(i)
            customAudienceFileList.push([
                audIdList[Math.floor(Math.random() * audIdList.length)],
                accIdList[Math.floor(Math.random() * accIdList.length)],
                productListFromGraph[i].siteId,
                productListFromGraph[i].sellerId,
                productListFromGraph[i].productId,
                startDateList[Math.floor(Math.random() * startDateList.length)],
                endDateList[Math.floor(Math.random() * endDateList.length)]
            ].join(',') + '\n');
        }

        return Buffer.from(customAudienceFileList.join(''), 'utf8').toString('base64');
    } catch (err) {
        console.log(`utils => generateCustomAudienceFile() => Error occurred : ${err.stack}`)
        return null;
    }
}

export const staticAudienceFileResponse = async function generateStaticAudienceFile(productListFromGraph, audIdList, accIdList, startDateList, endDateList) {
    try {
        console.log(`utils => generateStaticAudienceFile() => function invoked..`)

        const staicAudienceFileList = []
        staicAudienceFileList.push("audience_id,account_id,site_id,seller_id,supc,rank,start_date,end_date\n")

        for (let i = 0; i <= productListFromGraph.length - 1; i++) {
            staicAudienceFileList.push([
                audIdList[Math.floor(Math.random() * audIdList.length)],
                accIdList[Math.floor(Math.random() * accIdList.length)],
                productListFromGraph[i].siteId,
                productListFromGraph[i].sellerId,
                productListFromGraph[i].productId,
                Math.floor(Math.random() * 9) + 1,
                startDateList[Math.floor(Math.random() * startDateList.length)],
                endDateList[Math.floor(Math.random() * endDateList.length)]
            ].join(',') + '\n');
        }

        return Buffer.from(staicAudienceFileList.join(''), 'utf8').toString('base64');
    } catch (err) {
        console.log(`utils => generateStaticAudienceFile() => Error occurred : ${err.stack}`)
        return null;
    }
}



