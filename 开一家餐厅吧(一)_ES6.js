class Restaurant{
    constructor(money, seats, employees){
        this.money=money;
        this.seats=seats;
        this.employees=employees||[];
    }

    hire(name, salary, category){
        var employee;
        switch (category){
            case 'server': 
                employee= new Server(name,salary);
                break;
            case 'chef': 
                employee= new Chef(name, salary);
                break;
            default:
                break;
        }
        if(this.employees.length>0){
            employee.id=this.employees[this.employees.length-1].id+1;
        }
        else{
            employee.id=1;
        }
        this.employees.push(employee);
    }

    dismiss(id){
        let employeeIndex=this.employees.findIndex((item)=>item.id===id);
        console.log(employeeIndex);
        this.employees[employeeIndex].isOnJob=false;
    }
};

class Employee{
    constructor(id,name,salary,category){
        this.id=id;
        this.name=name;
        this.salary=salary;
        this.category=category;
        this.isOnJob=true;
    }

    task(){

    }
};

class Server extends Employee{
    constructor(name,salary){
        super(null,name,salary,'server');
    }

    task(...args){
        if(args[0] instanceof Array){
            //点菜
            return;
        }
        else{
            //上菜
            return;
        }
    }
};

class Chef extends Employee{
    constructor(name, salary){
        super(null,name,salary,'chef');
    }

    task(){
        //烹饪
    }
};

class eater{
    constructor(){}

    order(){
        
    }

    eat(){

    }
};

class dish{
    constructor(name, cost, price){
        this.name=name;
        this.cost=cost;
        this.price=price;
    }
}

//测试代码
let ifeRestaurant = new Restaurant(1000000,20,[]);
ifeRestaurant.hire('TOny',10000,'chef');
console.log(ifeRestaurant);
ifeRestaurant.dismiss(1);
console.log(ifeRestaurant);

