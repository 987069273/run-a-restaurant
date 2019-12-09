//餐厅类
class Restaurant{
    constructor(money, employees){
        this.money=money;
        this.employees=employees||[];
        this.menu=[];
    }

    get seats(){
        return this._seats;
    }

    set seats(seats){
        this._seats=[];
        for(let i=0; i<seats; i++){
            this._seats[i]=false;//以布尔值标记当前座位是否被占用
        }
        return this._seats;
    }

    hire(name,salary,category,skills){
        var employee;
        switch (category){
            case 'server': 
                employee=Server.modifyInstance.getInstance(name,salary);
                break;
            case 'chef': 
                employee=Chef.modifyInstance.getInstance(name, salary, skills);
                break;
            default:
                break;
        }
        try{
            if(this.employees.includes(employee)){
                throw '该类雇员已经有一个了';
            }
            else{
                if(this.employees.length>0){
                    employee.id=this.employees[this.employees.length-1].id+1;
                }
                else{
                    employee.id=1;
                }
                this.employees.push(employee);
                //修改菜单
                if(category==='chef'){
                    this.modifyMenu.call(this,employee,'add');
                }
            }
        }
        catch(err){
            alert(err);
        };
    }

    dismiss(id){
        let employee=this.employees.find(function(el){return el.id===id});
        if(employee){
            employee.isOnJob=false;//将在职状态修改为false
            switch (employee.category){
                case 'server':
                    Server.modifyInstance.dismissInstance();
                    break;
                case 'chef':
                    Chef.modifyInstance.dismissInstance();
                    //修改菜单
                    this.modifyMenu.call(this,employee,'remove');
                    break;
                default:
                    break;
            }
        }
        else{
            alert('不存在此id的雇员');
        }
        
    }


    modifyMenu(chef, operation){
        if(operation==='add'){
            chef.cookingSkill.forEach((item)=>{
                if(!this.menu.some((el)=>(el.name===item))){
                    //暂未对菜品计算成本和定价
                    let dish= new Dish(item,null, null);
                    this.menu.push(dish);
                }
            })
        }
        else if(operation==='remove'){
            let otherChef=this.employees.filter((item)=>{item.isOnJob&&item.category==='chef'});
            //获取其他厨师的菜品的并集
            let otherChefSkill=new Set(otherChef.map((item)=>{item.skill}).flat(Infinity));
            this.menu=this.menu.filter((item)=>otherChefSkill.has(item));
        }
    }

    serve(eaterInfo, callback){//eaterInfo应为数组

        let eaterAndServerInfo=Server.modifyInstance.getInstance().task(eaterInfo);

        let order=Order.orders.getNewOrder(eaterAndServerInfo.eater, eaterAndServerInfo.seat, eaterAndServerInfo.dishes, eaterAndServerInfo.server);

        for(let i=0; i<order.dishes.length; i++){
            let dish=Chef.modifyInstance.getInstance().modifyWaitingDishes(order.dishes[i]).receive();
            callback(Server.modifyInstance.getInstance().task(dish));
        }
    }

};

class Employee{
    constructor(name,salary,category){
        this.isOnJob=true;
        this.name=name;
        this.salary=salary;
        this.category=category;
    }

    get id(){
        return this._id;
    }

    set id(id){
        this._id=id;
    }

    get isOnJob(){
        return this._isOnJob;
    }

    set isOnJob(isOnJob){
        this._isOnJob=isOnJob;
    }

    task(){

    }

};

class Server extends Employee{
    constructor(name,salary){
        super(name,salary,'server');
    }

    task(...args){
        if(args[0] instanceof Array){
            let eater=args[0][0].eater;
            return {eater:eater, seat:eater.seat, dishes:eater.dishes, server:this};
        }
        else{
            //console.log(args);
            let dish=args[0];
            dish.ready=true;
            return dish;
        }
    }
};

Server.modifyInstance=(function(){
    var instance;
    return {
        getInstance:function(name,salary){
            if(!instance){
                instance=new Server(name, salary);
            }
            return instance;
        },
        dismissInstance:function(){
            instance=null;
        }
    }
})();


class Chef extends Employee{
    constructor(name, salary, cookingSkill){
        super(name,salary,'chef');
        this.cookingSkill=cookingSkill||[];
        this.waitingDishes=[];
    }

    task(dish){
       this.modifyWaitingDishes(dish).finish();
       //console.log('the dish is cooked');
       return dish;
    }

    modifyWaitingDishes(dish){
        let waitingDishes=this.waitingDishes;

        return {
            receive:()=>{ 
                waitingDishes.push(dish);
                //console.log('receive a new dish');
                return this.task(dish);
            },
            finish:()=>{
                waitingDishes.splice(waitingDishes.indexOf(dish),1);
            },
        }
    };
};

Chef.modifyInstance=(function(){
    var instance;
    return {
        getInstance:function(name,salary, cookingSkill){
            if(!instance){
                instance=new Chef(name, salary, cookingSkill);
            }
            return instance;
        },
        dismissInstance:function(){
            instance=null;
        }
    }
})();


class Eater{
    constructor(seat, dishes){
        this.seat=seat;
        this.dishes=dishes;
    }

    get dishes(){
        return this._dishes;
    }

    set dishes(dishes){
        this._dishes=dishes;
    }

    order(){
        return [{eater:this, seat:this.seat, dishes:this.dishes}];
    }

    eat(){
        console.log('eating...');
    }
};

class Dish{
    constructor(name,cost,price){
        this.name=name;
        this.cost=cost;
        this.price=price;
    }

    get cost(){
        return this._cost;
    }

    set cost(cost){
        this._cost=cost;
    }

    get price(){
        return this._price;
    }

    set price(price){
        this._price=price;
    }
}

class Order{
    constructor(id, eater, seat, dishes, server){
        this.id=id;
        this.eater=eater;
        this.dishes=dishes;
        this.seat=seat;
        this.server=server;
    }

    get id(){
        return this._id;
    }

    set id(id){
        this._id=id;
    }

    /*get server(){
        return this._server;
    }

    set server(server){
        this._serve=server;
    }*/
    
}

//采用闭包形式
Order.orders=(function(){
    let count=0, orders=[];
    return {
        getNewOrder:function(eater,seat,dishes,server){
            let order=new Order(null, eater, seat, dishes, server);
            order.id=count+1;
            count++;
            orders.push(order);
            return order;
        },

        getOrders:function(){
            return orders;
        }


    };
})();


//测试代码
let newRestaurant=new Restaurant(10000, []);
newRestaurant.seats=1;
newRestaurant.hire('Zoe',1500,'chef',['salad','baking']);
newRestaurant.hire('Tim',1200,'server');
console.log(newRestaurant.menu);
newRestaurant.dismiss(1);
console.log(newRestaurant.menu);
newRestaurant.hire('Rela',1500,'chef',['salad','BBQ']);
console.log(newRestaurant.menu);


let eater1=new Eater(0);

eater1.dishes=[newRestaurant.menu[0],newRestaurant.menu[1]];

newRestaurant.serve(eater1.order(),eater1.eat);



