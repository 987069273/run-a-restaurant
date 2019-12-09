//餐厅的构造函数
function Restaurant(money, seats, employees){
    this.money=money;
    this.seats=seats;
    this.employees=employees||[];
    //console.log('create a new restaurant');
};

//餐厅类的方法
Restaurant.prototype={
    hire:function(name, salary, category){
        var employee;
        switch (category){
            case 'server': 
                employee= new Server(name,salary);
                break;
            case 'chef': 
                employee= new Chef(name, salary);
                break;
            //不太确定怎么处理
            default:
                employee= new Employee(name, salary, category);
        }
        if(this.employees.length>0){
            employee.id=this.employees[this.employees.length-1].id+1;
        }
        else{
            employee.id=1;
        }
        this.employees.push(employee);
    },
    dismiss:function(id){
        var employee;
        this.employees.forEach(
            function(item){
                if(item.id===id){
                    employee=item;
                }
            }
        );
        employee.isOnJob=false;//将在职状态修改为false
    },

};

//职员的构造函数
function Employee(name, salary,category){
    this.id;
    this.isOnJob=true;
    this.name=name;
    this.salary=salary;
    this.category=category;
};

//职员类的方法
Employee.prototype={
    task:function(){},
};

//服务员类
function Server(name,salary){
    Employee.call(this,name,salary,'server');
};

Server.prototype=Object.create(Employee.prototype);//继承Employee类，使用Object.create()方法而非new一个实例，参看https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript
Server.prototype.constructor=Server;

Server.prototype.task=function(){
    var args =Array.from(arguments);
    if(args[0] instanceof Array){
        //点菜相关操作
        return;
    }
    else{
        //上菜相关操作
        return;
    }
};

//厨师的构造函数
function Chef(name,salary){
    Employee.call(this,name,salary,'chef');
};

Chef.prototype=Object.create(Employee.prototype);
Chef.prototype.constructor=Chef;

Chef.prototype.task=function(){
    //烹饪相关操作
};

function Eater(){};

Eater.prototype={
    order:function(){},
    eat:function(){},
};

//测试代码
var newRestaurant= new Restaurant(10000, 1, []);
newRestaurant.hire('Amy',1200, 'server');
console.log(ifeRestaurant);
newRestaurant.dismiss(1);
console.log(ifeRestaurant);


