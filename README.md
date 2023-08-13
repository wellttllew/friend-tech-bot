# friend.tech Bot 

- [friend.tech Bot](#friendtech-bot)
  - [run the bot](#run-the-bot)
  - [Rebuild the list of qualified subjects](#rebuild-the-list-of-qualified-subjects)
  - [PnL](#pnl)
  - [Risk](#risk)



**AT YOUR OWN RISK!**

A simple naive bot to buy shares from qualified subjects. 
A qualified subject satisfies any of the following requirements: 

- A subject is considered qualified if the share supply of that subject is great enough (e.g > 10)  
- A subject is considered qualified if a qualified subject bought his/her share. 

Why define "qualified subjects" as above? 

- The subject that satisfies the first condition may be a KOL. However his share is too expensive, it is riskier and capital-inefficient to buy these shares.   
- The subject that satisfies the second condition could also be a KOL. And if his share is cheap, he may be just onboarding `friend.tech`. And there is a high possibility that he will gather more holders. 

read [this](https://cocococococo.notion.site/Friend-tech-6b52ab29617b402ca04ecf27526139d5) for more. 


## run the bot


```bash
export PRIVATE_KEY=xxxx 
yarn run:buy
```


Change `MAX_PRICE_PERSHARE` in [constants.ts](src/constants.ts), if you can accept more expensive shares. 


## Rebuild the list of qualified subjects 

The current list of qualified subjects is built at block `#2521441`. If you want to rebuild the list of qualified subjects, run the following cmd:  

```bash 
yarn rebuild-qualified
```

Running this cmd would override `db.sqlite`.  


## PnL

Use the following cmd to analyze your PnL: 

```bash 
yarn run:pnl
```

## Risk 

If some spammer finds this repo and learns the strategy that I used. He may spam my bot. 