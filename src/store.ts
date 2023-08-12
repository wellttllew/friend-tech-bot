import { Sequelize, Model,DataTypes, ModelStatic } from "sequelize";



export class Subject extends Model{
    declare id:number;
    declare address:string; // the address of the subject 
    declare holders:number; // the number of holders of the subject's share
}

export class Meta extends Model{
    declare id:number;
    declare lastSyncedBlock:number; // the last synced block number
}

export class HoldingShare extends Model{
    declare id:number;
    declare subject:string; // the address of the subject 
    declare price:string; // price in hex 
}

// Store is a singleton class 
export class Store{

    private static instance:Store;
    private sequelize:Sequelize;
    private subject: ModelStatic<Subject>;
    private meta: ModelStatic<Meta>;
    private holdingShare: ModelStatic<HoldingShare>;

    private constructor(){
        this.sequelize = new Sequelize({
            logging: false,
            dialect: "sqlite",
            storage: "./db.sqlite" // use a database at current directory
        });

        // define the models
        this.subject = Subject.init({
            id:{
                type:DataTypes.INTEGER,
                primaryKey:true,
                autoIncrement:true
            },
            address:{
                type:DataTypes.STRING,
                allowNull:false,
                unique:true,
            },
            holders:{
                type:DataTypes.INTEGER,
                allowNull:false,
                defaultValue:0
            },
        },{
            sequelize:this.sequelize,
            indexes:[ 
                {
                    unique:true,
                    fields:["address"]
                }
            ]
        });

        this.meta = Meta.init({
            id:{
                type:DataTypes.INTEGER,
                primaryKey:true,
                autoIncrement:true
            },
            lastSyncedBlock:{
                type:DataTypes.INTEGER,
                allowNull:false,
                defaultValue: 0 
            }},
            {
                sequelize:this.sequelize,
            });

        this.holdingShare = HoldingShare.init({
            id:{
                type:DataTypes.INTEGER,
                primaryKey:true,
                autoIncrement:true
            },
            subject:{
                type:DataTypes.STRING,
                allowNull:false,
                unique:true,
            },
            price:{
                type:DataTypes.STRING,
                allowNull:false,
            }
        },{
            sequelize:this.sequelize,
        });


    }

    public static async getInstance(){
        if(!Store.instance){
            Store.instance = new Store();

            // migrate 
            await Store.instance.sequelize.sync({
                alter: true
            });

            // insert the first meta record
            // create if not exists
            // https://basescan.org/tx/0xa7eba644182d78c4568364e00b0320a9fde9c1fe779cdbec6941fb7443d14c01
            await Store.instance.meta.findOrCreate({
                where:{
                    id:1
                },
                defaults:{
                    lastSyncedBlock: 2430440 
                }
            });
        }
        return Store.instance;
    }

    public getSubject(){
        return this.subject;
    }

    public getMeta(){
        return this.meta;
    }

    public getHoldingShare(){
        return this.holdingShare;
    }

}

