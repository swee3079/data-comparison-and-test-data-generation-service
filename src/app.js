import express from 'express'
import multer from 'multer'
import { requestToCSVConverter, requestToJsonConverter } from './utils/utils.js'

const upload = multer({ dest: 'src/uploads/' })

const app = express();
const PORT = process.env.PORT || 5000;


const cpUpload = upload.fields([
    { name: 'csvFile', maxCount: 1 },
    { name: 'jsonFile', maxCount: 8 }
])

app.post('/api/comparison/compare', cpUpload, async (req, res, next) => {
    console.log('File comaprison controller invoked...')
    try {
        let matchingSupcList = [];
        let matchingUnorderedSupcList = [];
        let unMatchingSupcListWithoutExistenceInGraphResponse = [];
        let unMatchingSupcListWithoutExistenceInAudienceFile = [];
        let responseCode = "SUCCESS";
        let responseMessage = "Matching Complete";
        let currentExecutedIndexOfGraphResponse = 0;

        //Gathering parameters from request
        const audienceFile = req.files['csvFile']?.[0]
        const graphResponseFile = req.files['jsonFile']?.[0]
        const sortByParameter = req.body.sortBy;
        const sortValueParameter = req.body.sortValue;

        //Input Data Validations
        if (!audienceFile || !graphResponseFile) {
            res.status(400).json({
                message: "Empty Request Parameters Exists",
                data: null
            })
        }

        const audienceFileInputResultList = await requestToCSVConverter(audienceFile.path, sortByParameter, sortValueParameter);
        const graphResponseResultList = await requestToJsonConverter(graphResponseFile.path, sortByParameter, sortValueParameter);

        if (!audienceFileInputResultList || audienceFileInputResultList.length === 0) {
           res.status(400).json({
                message: "Audience file is empty",
                data: null
            })
        }

        if (!graphResponseResultList || graphResponseResultList.length === 0) {
            res.status(400).json({
                message: "Graph response file is empty",
                data: null
            })
        }




        for (let i = 0; i < graphResponseResultList.length; i++) {
            currentExecutedIndexOfGraphResponse++;
            const productIdFromGraph = graphResponseResultList[i].productId;

            if (i < audienceFileInputResultList.length) {
                const productIdFromCSV = audienceFileInputResultList[i].supc;
                if (productIdFromGraph === productIdFromCSV) {
                    matchingSupcList.push({
                        productIdFromAudienceInput: productIdFromCSV,
                        productIdFromGraphResponse: productIdFromGraph,
                        rowNumber: String(i + 1)
                    });
                } else {
                    let existsInUnmatch = false;

                    for (let j = 0; j < graphResponseResultList.length; j++) {
                        const productIdFromGraph2 = graphResponseResultList[j].productId;

                        if (productIdFromGraph2 === productIdFromCSV) {
                            existsInUnmatch = true;
                            responseCode = "ERROR";
                            responseMessage = "Mismatch Found";
                            matchingUnorderedSupcList.push({
                                productIdFromAudienceInput: productIdFromCSV,
                                productIdFromGraphResponse: productIdFromGraph2,
                                rowNumber: String(i + 1)
                            });
                            break;
                        }
                    }

                    if (!existsInUnmatch) {
                        responseCode = "ERROR";
                        responseMessage = "Mismatch Found";
                        unMatchingSupcListWithoutExistenceInGraphResponse.push({
                            productIdFromAudienceInput: null,
                            productIdFromGraphResponse: productIdFromCSV,
                            rowNumber: String(i + 1)
                        });
                        unMatchingSupcListWithoutExistenceInAudienceFile.push({
                            productIdFromAudienceInput: productIdFromGraph,
                            productIdFromGraphResponse: null,
                            rowNumber: null
                        });
                    }
                }
            } else {
                let notExisting = 0;
                for (let k = 0; k < audienceFileInputResultList.length; k++) {
                    const supcFromAudienceFile = audienceFileInputResultList[k].supc;

                    if (productIdFromGraph === supcFromAudienceFile) {
                        let recordAlreadyExists = false;
                        for (const record of matchingUnorderedSupcList) {
                            if (record.productIdFromAudienceInput === supcFromAudienceFile) {
                                recordAlreadyExists = true;
                                break;
                            }
                        }
                        if (!recordAlreadyExists) {
                            matchingUnorderedSupcList.push({
                                productIdFromAudienceInput: supcFromAudienceFile,
                                productIdFromGraphResponse: productIdFromGraph,
                                rowNumber: null
                            });
                        }
                        break;
                    }
                    notExisting++;
                }

                if (notExisting === audienceFileInputResultList.length) {
                    unMatchingSupcListWithoutExistenceInAudienceFile.push({
                        productIdFromAudienceInput: productIdFromGraph,
                        productIdFromGraphResponse: null,
                        rowNumber: null
                    });
                }
            }
        }

        if (graphResponseResultList.length < audienceFileInputResultList.length) {
            for (let k = currentExecutedIndexOfGraphResponse; k < audienceFileInputResultList.length; k++) {
                unMatchingSupcListWithoutExistenceInGraphResponse.push({
                    productIdFromAudienceInput: null,
                    productIdFromGraphResponse: audienceFileInputResultList[k].supc,
                    rowNumber: String(k + 1)
                });
            }
        }

        res.status(200).json({
            message: responseMessage,
            responseCode,
            matchingSupcList,
            matchingUnorderedSupcList,
            unMatchingSupcListWithoutExistenceInGraphResponse,
            unMatchingSupcListWithoutExistenceInAudienceFile
        });
        res.end()
    } catch (err) {
        console.log(`Exception Occurred : ${err}`)
        res.status(400).json({
            message: "Oops! Something Went Wrong!!",
            data: null
        })
    }
})



app.listen(PORT, () => {
    console.log(`Server started on port ${PORT} sucessfully`)
}
);