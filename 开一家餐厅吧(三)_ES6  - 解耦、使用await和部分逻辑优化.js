/*相对于上一个版本：使用async和await对异步过程进行了整理；对一些耦合度较高的函数进行了解耦；对于最后测试代码的逻辑进行了简单优化*/


//餐厅类
class Restaurant{
    constructor(money, employees,seatsNumber){
        this.money=money;
        this.employees=employees||[];
        this.seats=new Array(seatsNumber);
        for(let i=0; i<seatsNumber; i++){
            this.seats[i]=false;
        }
        this.menu=[];

        this.modifyMenu=this.modifyMenu.bind(this);
        this.serve=this.serve.bind(this);
    }

    //以下是一系列用于创建或者销毁实例的方法
    getServer=function (name, salary){
        return Server.instances.getInstance(name,salary);
    }

    getChef=function (name, salary, skills) {
        return Chef.instances.getInstance(name, salary, skills);
    }

    createNewDish=function (item, cost, price, time) {
        let args=Array.from(arguments);
        return new Dish(...args);
    }

    dismissServer=function (id) {
        return Server.instances.dismissInstance();
    }

    dismissChef=function (id) {
        return Chef.instances.dismissInstance();
    }

    createNewOrder=function (eater,seat,dishes,server) {
        let newOrder=new Promise((resolve, reject)=>{
            let order=Order.orders.createNewOrder(eater,seat,dishes,server);
            resolve(order);
        });
        return newOrder;
    }

    getOrdersToCook=function () {
        return Order.orders.getOrdersToCook();
    }

    receiveDish=function (orders, order, dish) {
        console.log(`receive ${dish}`);
        let args=Array.from(arguments);
        return Chef.receive(...args);
    }

    


    
    
    hire(name,salary,category,skills){
        let employee;
        switch (category){
            case 'server': 
                employee=this.getServer(name, salary);
                break;
            case 'chef': 
                employee=this.getChef(name, salary, skills);
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
                //如果是雇佣的厨师，则需修改菜单
                if(category==='chef'){
                    this.modifyMenu.call(this,employee,true);
                }
            }
        }
        catch(err){
            alert(err);
        };
    }

    dismiss(id){
        let employee=this.employees.find(function(el){return el.id===id});
        if(!employee){
            alert('不存在此id的雇员');
        }
        else{
            employee.isOnJob=false;//将在职状态修改为false
            switch (employee.category){
                case 'server':
                    this.dismissServer();
                    break;
                case 'chef':
                    this.dismissChef();
                    //修改菜单
                    this.modifyMenu.call(this,employee,false);
                    break;
                default:
                    break;
            }
        }
        
    }

    earn(money){
        console.log(`earn ${money}`);
        this.money=+money;
    }

    modifyMenu(chef, toAdd){//将第二个参数类型从string改为boolean,降低复杂度,toAdd为真时执行添加操作，为假时执行移除操作
        if(toAdd){
            chef.cookingSkill.forEach((item)=>{
                if(!this.menu.some((el)=>(el.name===item))){
                    //暂未对菜品计算成本
                    let dish= this.createNewDish(item, null, 100, 3000);//最近一次修改把时间参数修改了,注意这儿的this通过构造函数中的bind方法进行了重新绑定
                    this.menu.push(dish);
                }
            })
        }
        else{
            let otherChef=this.employees.filter((item)=>{item.isOnJob&&item.category==='chef'});
            //获取其他厨师的菜品的并集
            let otherChefSkill=new Set(otherChef.map((item)=>{item.skill}).flat(Infinity));
            this.menu=this.menu.filter((item)=>otherChefSkill.has(item));
        }
    }

    provideSeat(){//新增，提供座位
        let emptySeats=[], seatNumber;
        //获取空座位的索引值
        this.seats.forEach((item,index)=>{if(!item){emptySeats.push(index)}});
        seatNumber=emptySeats[Math.floor(Math.random()*emptySeats.length)];
        this.seats[seatNumber]=true;
        return seatNumber;
    }

    recycleSeat(number){//回收座位
        this.seats[number]=false;
    }
    

    //这个函数较为复杂，相对于上一个版本，使用了async和await来对一些异步过程进行了整理；对于上个版本中嵌套较深的函数，做了一些解耦处理；但对于循环过程中的异步，未有大的改动，可能后续仍需优化
    async serve(eaterInfo){
        console.log('receive a new order...');
        let info=await this.getServer().task(eaterInfo);
        let order=await this.createNewOrder(info.eater, info.seat, info.dishes, info.server);
        let orders, promise;
        
        for(let i=0; i<order.dishes.length; i++){
            let orders=this.getOrdersToCook();
            promise=this.receiveDish(orders, order, order.dishes[i]);
        }
        promise.then((orders)=>{
                let dishes=order.server.task(order.eater, orders);
                dishes.then((dishes)=>{
                    console.log('going to serve a dish');
                    for(let i=0; i<dishes.length; i++){
                        let dish=order.eater.eat(dishes[i],order);
                        dish.then((order)=>{
                            if(order.eatenDishes.length===order.dishes.length){
                                console.log('check if it is the last dish');
                                this.earn(order.eater.pay(order));
                                this.recycleSeat(order.seat);
                            }
                        })
                    }
                });
            });
    }
};


class Employee{
    constructor(name,salary,category){
        this.id;
        this.isOnJob=true;//isOnjob属性便于区分该雇员是否还在岗
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
        throw new Error('该类是抽象类，不能实例化');//仿照https://www.cnblogs.com/wfaceboss/p/7661020.html
    }

};

class Server extends Employee{
    constructor(name,salary){
        super(name,salary,'server');
        this.busy=false;
    }

    get busy(){
        return this._busy;
    }

    set busy(isBusy){
        this._busy=isBusy;
    }

    task(...args){
        if(args[0] instanceof Array){
            this.busy=true;
            let orderPromise=new Promise((resolve, reject)=>{
                setTimeout(()=>{
                    //点菜——添加server信息
                    console.log(`${this.name} is taking the order...`);
                    let eater=args[0][0].eater;
                    resolve({eater:eater, seat:eater.seat, dishes:eater.dishes, server:this});
                    this.busy=false;
                },500);//暂且设定耗时为0.5个时间单位
            });
            return orderPromise;
        }
        else{
            if(!this.busy){
                this.busy=true;
                let servePromise=new Promise((resolve, reject)=>{
                    setTimeout(()=>{
                        //上菜,第一个参数为eater,第二个参数为orders
                        console.log(`${this.name} is serving dishes...`);
                        let order=args[1].find((item)=>{return item.eater===args[0]});
                        let dishes=order.cookedDishes.filter((item)=>{return !order.servedDishes.includes(item)});
                        dishes.forEach((item)=>{
                            order.servedDishes.push(item);
                        });
                        console.log(`the dishes are ${dishes}`);
                        resolve(dishes);
                        this.busy=false;
                    },500)
                });
                return servePromise;
            }
            else{
                return;
            }
            
        }
    }
};

Server.instances=(function(){
    let instance;
    return {
        getInstance:function(name,salary){
            if(!instance){
                instance=new Server(name, salary);
            }
            return instance;
        },
        getSpareInstances:function(){

        },
        dismissInstance:function(){//当雇员离职时会调用该函数，修改instance的指向后可以释放相应的内存，仅适用于单例模式
            instance=null;
        }
    }
})();


class Chef extends Employee{ 
    constructor(name, salary, cookingSkill){
        super(name,salary,'chef');
        this.cookingSkill=cookingSkill||[]; //cookingSkills与餐厅的菜单相关
        this.busy=false;
    }

    get busy(){
        return this._busy;
    }

    set busy(isBusy){
        this._busy=isBusy;
    }

    task(dish, orders){
        setTimeout(()=>{

        },dish.time);
        console.log(`cooking ${dish.name}...`);
        return orders;
    }

    getDish(orders, dish, callback1, callback2){
        this.busy=true;
        let assignedOrders=callback1(orders,dish);
        this.task(dish, assignedOrders);
        callback2(orders, dish);
        this.busy=false;
        console.log('finish the dish');
    };

    static getInstance(){
        return Chef.instances.getInstance();
    };

    //耦合度高，待修改
    static receive(orders, order, dish){
        let p1=new Promise((resolve, reject)=>{
            let queryTimer=setInterval(()=>{
                console.log('try to find an appropriate cook');
                let chef=this.getInstance();
                if(!chef.busy&&chef.cookingSkill.includes(dish.name)){
                    order.cookingDishes.push(dish);
                    chef.getDish(orders,dish,this.assignDish, this.finishDish);
                    resolve(orders);
                    clearInterval(queryTimer);
                }
            },1000);
            queryTimer;
        });
        return p1;
    };

    static assignDish(orders,dish){
        let assignedOrders=[];
        orders.forEach((item)=>{
            if(item.dishes.includes(dish)&&!item.cookingDishes.includes(dish)&&!item.cookedDishes.includes(dish)){
                item.cookingDishes.push(dish);
                assignedOrders.push(item);
            }
        });
        return assignedOrders;
    };

    static finishDish(orders, dish){
        orders.forEach((item)=>{
            item.cookingDishes.splice(item.cookingDishes.indexOf(dish),1);
            item.cookedDishes.push(dish);
        });
    }
};

Chef.instances=(function(){
    let instance;
    return {
        getInstance:function(name, salary, cookingSkill){
            if(!instance){
                instance=new Chef(name, salary, cookingSkill);
            }
            return instance;
        },
        getSpareInstances:function(){

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

    //不确定是否需要这个属性？
    get dishes(){
        return this._dishes;
    }

    set dishes(dishes){
        this._dishes=dishes;
    }

    order(menu){
        let dishesPromise=new Promise((resolve, reject)=>{
            setTimeout(()=>{
                let dishNumber=Math.floor(Math.random()*menu.length)+1;//至少点一个，至多点全部
                let dishes=new Set();
                //随机点菜，直到不重复的菜品个数与dishNumber相等
                while(dishes.size<dishNumber){
                    let dishIndex=Math.floor(Math.random()*menu.length);
                    dishes.add(menu[dishIndex]);
                }
                this.dishes=[...dishes];
                console.log('ordering these dishes:');
                console.log(this.dishes);
                resolve([{eater:this, seat:this.seat, dishes:this.dishes}]);//该形式主要为了方便与server的task方法相配合
            },3000);
        });
        return dishesPromise;
    }

    eat(dish,order){
        return new Promise((resolve, reject)=>{
            setTimeout(()=>{
                console.log(`eating ${dish.name}`);
                order.eatenDishes.push(dish);
                resolve(order);
            },3000);
        });
    }

    pay(order){
        let money;
        if(order.dishes.length===1){
            money=order.dishes[0].price;
        }
        else{
            money=order.dishes.reduce((acc,cur)=>{
                return acc.price+cur.price;
            });
        }
        return money;
    }
};


class Dish{
    constructor(name,cost,price,time){
        this.name=name;
        this.cost=cost;
        this.price=price;
        this.time=time;
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

    get time(){
        return this._time;
    }

    set time(time){
        this._time=time;
    }

}

class Order{
    constructor(id, eater, seat, dishes, server){
        this.id=id;
        this.eater=eater;
        this.dishes=dishes;
        this.seat=seat;
        this.server=server;

        this.cookingDishes=[];
        this.cookedDishes=[];
        this.servedDishes=[];
        this.eatenDishes=[];
    }

    get id(){
        return this._id;
    }

    set id(id){
        this._id=id;
    }

    cooking(dish){
        this.cookingDishes.push(dish);
    }

    finishCooking(dish){
        this.cookedDishes.push(dish);
    }

    serve(dish){
        this.finishedDishes.push(dish);
    }

    eat(dish){
        this.eatenDishes.push(dish);
    }
    
}

//采用闭包形式
Order.orders=(function(){
    let count=0, orders=[];
    return {
        createNewOrder:function(eater,seat,dishes,server){
            console.log('going to create a new order');
            let order=new Order(null, eater, seat, dishes, server);
            order.id=count+1;
            count++;
            orders.push(order);
            return order;
        },

        getOrdersToCook:function(){
            let ongoingOrders=orders.filter((item)=>{return item.cookedDishes.length!==item.dishes.length});
            return ongoingOrders;
        },

        getFinishedOrders:function(){
            let finishedOrders=orders.filter((item)=>{return item.eatenDishes.length===item.dishes.length});
            return finishedOrders;
        },

        resetOrders:function(){//用于重置
            count=0;
            orders=[];
        },

    };
})();


//测试代码
let newRestaurant=new Restaurant(10000, [],1);
newRestaurant.hire('Zoe',1500,'chef',['salad','baking']);
newRestaurant.hire('Tim',1200,'server');
newRestaurant.dismiss(1);
newRestaurant.hire('Rela',1500,'chef',['salad','BBQ']);
let newEater=function(seat){
    return new Eater(seat);
};

setInterval(()=>{
    let seat=newRestaurant.provideSeat();
    if(seat===undefined){//不能使用“!seat”，因为会涵盖seat===0的情况
        return;
    }
    else{
        console.log('a new eater comes');
        let eater=newEater(seat);
        let dishesPromise=eater.order(newRestaurant.menu);
        dishesPromise.then(function(eaterInfo){
            newRestaurant.serve(eaterInfo);
        });
    }
},2000);//随意写的间隔时间



