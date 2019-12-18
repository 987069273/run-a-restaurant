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

    set seats(seats){ //seats的类型为数组，每一项以布尔值标记当前座位是否被占用
        this._seats=[];
        for(let i=0; i<seats; i++){
            this._seats[i]=false;
        }
        return this._seats;
    }

    

    hire(name,salary,category,skills){
        let employee;
        switch (category){
            case 'server': 
                employee=Server.instanceMethods.getInstance(name,salary);
                break;
            case 'chef': 
                employee=Chef.instanceMethods.getInstance(name, salary, skills);
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
                    Server.instanceMethods.dismissInstance();
                    break;
                case 'chef':
                    Chef.instanceMethods.dismissInstance();
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

    getMoney(){
        return this.money;
    }


    modifyMenu(chef, toAdd){//将第二个参数类型从string改为boolean,降低复杂度,toAdd为真时执行添加操作，为假时执行移除操作
        if(toAdd){
            chef.cookingSkill.forEach((item)=>{
                if(!this.menu.some((el)=>(el.name===item))){
                    //暂未对菜品计算成本和定价
                    let dish= new Dish(item,null, 100, null);
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
        let emptySeats=[];
        //获取空座位的索引值
        this.seats.forEach((item,index)=>{if(!item){emptySeats.push(index)}});
        let seatNumber=emptySeats[Math.floor(Math.random()*emptySeats.length)];
        this.seats[seatNumber]=true;
        return seatNumber;
    }

    recycleSeat(number){
        this.seats[number]=false;
    }

};

Restaurant.prototype.serve=function (eaterInfo){
    console.log('receive a new order...');
    let eaterAndServerInfo=Server.instanceMethods.getInstance().task(eaterInfo);

    eaterAndServerInfo.then((info)=>{
        return new Promise((resolve, reject)=>{
            let order=Order.orders.createNewOrder(info.eater, info.seat, info.dishes, info.server);
            resolve(order)}
        )}).then((order)=>{
                let p1;
                for(let i=0; i<order.dishes.length; i++){
                    let orders=Order.orders.getOngoingOrders();
                    p1=Chef.receive(orders, order, order.dishes[i]);
                }
                p1.then((orders)=>{
                    let dishes=order.server.task(order.eater, orders);
                    dishes.then((dishes)=>{
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
                })
            });
};


class Employee{
    constructor(name,salary,category){
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

    }

};

class Server extends Employee{
    constructor(name,salary){
        super(name,salary,'server');
    }

    task(...args){
        if(args[0] instanceof Array){
            let orderPromise=new Promise((resolve, reject)=>{
                setTimeout(()=>{
                    //点菜——添加server信息
                    console.log(`${this.name} is taking the order...`);
                    let eater=args[0][0].eater;
                    resolve({eater:eater, seat:eater.seat, dishes:eater.dishes, server:this});
                },500);
            });
            return orderPromise;
        }
        else{
            let servePromise=new Promise((resolve, reject)=>{
                setTimeout(()=>{
                    //上菜,第一个参数为eater,第二个参数为orders
                    console.log(`${this.name} is serving dishes...`);
                    let order=args[1].find((item)=>{return item.eater===args[0]});
                    let dishes=order.cookedDishes.filter((item)=>{return !order.servedDishes.includes(item)});
                    dishes.forEach((item)=>{
                        order.servedDishes.push(item);
                    });
                    resolve(dishes);
                },500)
            });
            return servePromise;
        }
    }
};

Server.instanceMethods=(function(){//将名称从modifyInstance改为instanceMethods，更为贴切
    let instance;
    return {
        getInstance:function(name,salary){
            if(!instance){
                instance=new Server(name, salary);
            }
            return instance;
        },
        dismissInstance:function(){//当雇员离职时会调用该函数，修改instance的指向后可以释放相应的内存
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

    static receive(orders, order, dish){
        let p1=new Promise(function(resolve, reject){
            let queryTimer=setInterval(()=>{
                console.log('try to find an appropriate cook');
                let chef=Chef.instanceMethods.getInstance();
                if(!chef.busy&&chef.cookingSkill.includes(dish.name)){
                    order.cookingDishes.push(dish);
                    chef.getDish(orders,dish,Chef.assignDish, Chef.finishDish);
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

Chef.instanceMethods=(function(){
    let instance;
    return {
        getInstance:function(name, salary, cookingSkill){
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
        this.finished=false;
    }

    get id(){
        return this._id;
    }

    set id(id){
        this._id=id;
    }

    get finished(){
        return this._finished;
    }

    set finished(toFinish){
        this._finished=toFinish;
    }

    cooking(dishName){
        this.cookingDishes.push(dishName);
    }

    finishCooking(dishName){
        this.cookedDishes.push(dishName);
    }

    serve(dishName){
        this.finishedDishes.push(dishName);
    }
    
}

//采用闭包形式
Order.orders=(function(){
    let count=0, orders=[];
    return {
        createNewOrder:function(eater,seat,dishes,server){
            let order=new Order(null, eater, seat, dishes, server, false);
            order.id=count+1;
            count++;
            orders.push(order);
            return order;
        },

        getOngoingOrders:function(){
            let ongoingOrders=orders.filter((item)=>!item.finished);
            return ongoingOrders;
        },

        getFinishedOrders:function(){
            let finishedOrders=orders.filter((item)=>!item.finished);
            return finishedOrders;
        },

        resetOrders:function(){
            count=0;
            orders=[];
        }

    };
})();


//测试代码
let newRestaurant=new Restaurant(10000, []);
newRestaurant.seats=1;
newRestaurant.hire('Zoe',1500,'chef',['salad','baking']);
newRestaurant.hire('Tim',1200,'server');
newRestaurant.dismiss(1);
newRestaurant.hire('Rela',1500,'chef',['salad','BBQ']);

setInterval(()=>{
    console.log('a new eater comes');
    let seat=newRestaurant.provideSeat();
    if(seat===undefined){
        return;
    }
    else{
        let eater=new Eater(seat);
        let dishesPromise=eater.order(newRestaurant.menu);
        dishesPromise.then(function(eaterInfo){
            newRestaurant.serve(eaterInfo);
        });
    }
},2000);



