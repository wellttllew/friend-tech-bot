import { Friend__factory } from "../types/ethers-contracts";
import { BASE_RPC_URL, FRIEND_TECH_CONTRACT } from "./constants";
import { Store } from "./store";
import { ethers } from "ethers";


// Contruct the list of qualified subjects 
// The results are saved in a sqlite db.
async function scan(){


    // open db 
    const db = await Store.getInstance();
    const progress = await db.getMeta().findOne();
    if(progress  == null){
        throw new Error("no meta found");
    }
    console.log(`last synced block: ${progress.lastSyncedBlock}`);

    // create provider 
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
    // create contract instance 
    const friend = Friend__factory.connect(FRIEND_TECH_CONTRACT,provider);


    // get latest block 
    const end = await provider.getBlockNumber();
    const start = progress!.lastSyncedBlock + 1;


    const step = 1000; 
    for(let c = start; c < end; c+=step){
        const trades = await friend.queryFilter(friend.filters.Trade(),c, Math.min(c+step-1,end));
        console.log(`scanning blocks from ${c} to ${Math.min(c+step-1,end)}: ${trades.length} logs found`);

        for(let t of trades){
            
            const [s,] = await db.getSubject().findOrCreate({where:{
                address:  t.args.subject
            },defaults:{
                address: t.args.subject,
                holders: 0,
            }});

            if(t.args.isBuy){
                s.holders  += t.args.shareAmount.toNumber();
            }else{
                s.holders  -= t.args.shareAmount.toNumber();
            }

            await s.save();
        }

        progress.lastSyncedBlock = c;
        await progress.save();

    }


}

scan().then(()=>{
    console.log("done")
    process.exit(0)
}).catch((err)=>{
    console.log(err)
    process.exit(1)
}) 
.finally(()=>{
    process.exit(0)
});