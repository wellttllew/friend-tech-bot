import { ethers } from "ethers";
import { Store } from "./store";
import { BASE_RPC_URL, FRIEND_TECH_CONTRACT } from "./constants";
import { Friend__factory } from "../types/ethers-contracts";
import fs from 'fs';


async function pnl() {

    // create provider
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

    // create contract instance 
    const contract = Friend__factory.connect(FRIEND_TECH_CONTRACT, provider);

    // open db 
    const store = await Store.getInstance();

    // load wallet
    const wallet = (() =>{

        if(process.env.PRIVATE_KEY != null){
            return new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
        }

        // I prefer to use keystore file than private key
        return ethers.Wallet.fromEncryptedJsonSync(fs.readFileSync("./keystore.json","utf8"), process.env.PASSWORD||"invalid password").connect(provider);

    })();

    // cal pnl one by one 
    let totalCost = ethers.BigNumber.from(0);
    let totalValue = ethers.BigNumber.from(0);

    const holdings = await store.getHoldingShare().findAll();

    for(let i=0; i< holdings.length; ++i){
        const holding = holdings[i];
        
        const count = await contract.sharesBalance(holding.subject,wallet.address);
        const sellingPrice = await contract.getSellPriceAfterFee(holding.subject,count);

        const pnl =  sellingPrice.sub(holding.price).mul(10000).div(holding.price).toNumber()/100;

        console.log(`${holding.subject} : ${pnl}% | cost: ${ethers.utils.formatEther(holding.price)} | value: ${ethers.utils.formatEther(sellingPrice)} | diff: ${ethers.utils.formatEther(sellingPrice.sub(holding.price))}`);

        totalCost = totalCost.add(holding.price);
        totalValue =  totalValue.add(sellingPrice);
    }

    const totalPnl = totalValue.sub(totalCost).mul(10000).div(totalCost).toNumber()/100;
    console.log("---------");
    console.log(`total : ${totalPnl}% | cost: ${ethers.utils.formatEther(totalCost)} | value: ${ethers.utils.formatEther(totalValue)} | diff: ${ethers.utils.formatEther(totalValue.sub(totalCost))}`);

    
}


pnl().catch(console.error).then(()=>process.exit(0));   