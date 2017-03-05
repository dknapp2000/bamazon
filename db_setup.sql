
drop database bamazon;

create database bamazon;

use bamazon;

create table product (
    id              integer auto_increment primary key,
    product_nm      varchar(40) not null,
    department_nm   varchar(40) not null,
    price           decimal(10,2) not null,
    on_hand         integer not null
);

create table department (
    id              integer auto_increment primary key,
    department_nm   varchar(40)
);

create table sales (
    id              integer auto_increment primary key,
    prod_id         integer not null,
    qty             integer not null
);

create view v_sales 
as 
select p.*,
       s.qty qty_sold,
       s.qty*p.price sales
  from sales s 
  join product p on s.prod_id = p.id
 order by p.id;

create view v_dept_sales 
as 
select p.department_nm,
       sum( s.qty ) qty_sold,
       sum( s.qty*p.price ) sales
  from sales s 
  join product p on s.prod_id = p.id
 group by p.department_nm
 order by 1;


insert into department ( department_nm ) values 
( 'Apparel' ),
( 'Sporting Goods' ),
( 'Electronics' ),
( "Movies" ),
( "Books" );

insert into product ( product_nm, department_nm, price, on_hand ) values 
( 'Shirt', 'Apparel', 20.00, 20 ),
( 'Pants', 'Apparel', 25.00, 25 ),
( 'Shoes', 'Apparel', 52.50, 4 ),
( 'Shotgun', 'Sporting Goods', 200.00, 3 ),
( 'Volleyball', 'Sporting Goods', 15, 200 ),
( 'MacBook Pro', 'Electronics', 2500.00, 2 ),
( 'Mrs. Doubtfire', 'Movies', 17.99, 2 ),
( 'Saving Mr. Banks', 'Movies', 17.99, 3 ),
( 'Twelve Angry Men', 'Movies', 17.99, 4 ),
( 'Javascript, the good parts', 'Books', 29.95, 6 ),
( 'Eloquent Javascript', 'Books', 29.95, 4 ),
( 'HTML5/CSS3', 'Books', 32.50, 5 );
