import { ethers, utils } from "ethers";
import { BASE_RPC_URL, FRIEND_TECH_CONTRACT, MAX_PRICE_PERSHARE } from "./constants";
import { Friend__factory } from "../types/ethers-contracts";
import { Store } from "./store";
import fs from "fs";

async function buy() {

    // create provider 
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

    // create contract instance
    const contract = Friend__factory.connect(FRIEND_TECH_CONTRACT, provider);

    // create wallet from private key
    // I prefer to use keystore file than private key
    
    const wallet = (() =>{

        if(process.env.PRIVATE_KEY != null){
            return new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
        }

        // I prefer to use keystore file than private key
        return ethers.Wallet.fromEncryptedJsonSync(fs.readFileSync("./keystore.json","utf8"), process.env.PASSWORD||"invalid password").connect(provider);

    })();

    // open database
    const store = await Store.getInstance();

    // load qualified subjects 
    const qualified = await (async () => {

        const qualified = new Set<String>();

        await store.getSubject().findAll({
            limit: 200,
            order: [['holders', 'DESC']]
        }).then(subjects => {

            subjects.forEach(subject => {
                console.log(`[QUALIFIED SUBJECT] ${subject.address} with ${subject.holders} holders`);
                if (subject.holders > 10) { // at least 10 holders
                    qualified.add(subject.address);
                }
            });
        });

        return qualified;
    })();



    let lastBlock = await provider.getBlockNumber();

    // The loop is quite naive 
    // Better to use a contract to handle the logic 
    for (; ;) {

        // get current block number
        const currentBlock = await provider.getBlockNumber();

        if (currentBlock == lastBlock) {
            // sleep for 1 second 
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }

        console.log(`[BLOCK] scan ${lastBlock+1} -> ${currentBlock}`);

        // get all new Trade Events from last block 
        const events = await contract.queryFilter(contract.filters.Trade(), lastBlock + 1, currentBlock);

        for (let i = 0; i < events.length; ++i) {

            const {trader,subject:tradingSubject} = events[i].args;

            // check if the trader is qualified subject
            if (qualified.has(trader)) {

                console.log(`[BUY]${trader} bought ${tradingSubject}`);

                // already bought, skip 
                const hasBought = await (
                    async () => {

                        // find the tradingSubject in HoldingShare table 
                        const holdingShare = await store.getHoldingShare().findOne({
                            where: {
                                subject: tradingSubject
                            }
                        });

                        return holdingShare != null;

                    })();

                if (hasBought) {
                    console.log(`[BUY]skipped: already bought ${tradingSubject}`);
                    continue;
                }


                // get the price of the tradingSubject 
                const price = await contract.getBuyPriceAfterFee(tradingSubject, 1);

                // too expensive, skip
                if (price.gt(MAX_PRICE_PERSHARE)) {
                    console.log(`[BUY]skipped: too expensive, ${tradingSubject} @ ${utils.formatEther(price)}`);
                    continue;
                }


                // buy 1 share of the tradingSubject 
                try {
                    const tx = await contract.connect(wallet).buyShares(tradingSubject, 1, {
                        value: price
                    });

                    // await tx 
                    const receipt = await tx.wait();

                    // check if the tx is successful
                    if (receipt.status == 1) {
                        console.log(`[BUY]success: ${tradingSubject} @ ${utils.formatEther(price)}`);

                        // save the tradingSubject to HoldingShare table
                        await store.getHoldingShare().create({
                            subject: tradingSubject,
                            price: price.toHexString(),
                        });

                    } else {
                        console.log(`[BUY]failed: ${tradingSubject} @ ${utils.formatEther(price)}, tx failed`);
                    }
                } catch (error) {
                    // log error 
                    console.log(`[BUY]failed: ${tradingSubject} @ ${utils.formatEther(price)}, error: ${error}`);
                }




            }
        }

        // update last block
        lastBlock = currentBlock;

    }


}


// run the buy function in a loop
(async function (){
    for(;;){
        try{
            return await buy();
        }catch(error){
            console.log(`[CRASHED] last time crashed due to ${error}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
})();
