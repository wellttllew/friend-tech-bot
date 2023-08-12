# friend.tech Bot 


A simple bot to buy shares from qualified subjects. 
A qualified subject satisfies any of the following requirements: 

- A subject is considered qualified if the share supply is great enough (e.g > 10)  
- A subject is considered qualified if a qualified subject bought his/her share. 


read [this](https://cocococococo.notion.site/Friend-tech-6b52ab29617b402ca04ecf27526139d5) first. 


## run the bot 


```bash
export PRIVATE_KEY=xxxx 
yarn run:buy
```


Change `MAX_PRICE_PERSHARE` in [src/constants.ts](constants.ts), if you can accept more expensive shares. 


## Rebuild the list of qualified subjects 

The current list of qualified subjects is built at block `#2521441`. If you want to rebuild the list of qualified subjects, run the following cmd:  

```bash 
yarn rebuild-qualified
```

Running this cmd would override `db.sqlite`.  
