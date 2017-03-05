/* Bamazon customer interface */

var mysql = require( "mysql" );
var inquirer = require( "inquirer" );
var sprintf=require("sprintf").sprintf;

var menuOptions;

/* Select which options are available depending on the command line options 'manager' */

if ( process.argv[2] === 'manager' ) {
    menuOptions = [ "List products", "Add product", "Update inventory", "Show sales", "Show dept sales","Quit" ];
} else {
    menuOptions = [ "Buy something", "List products",   "Quit" ];
}

// Here we have the lovely connection information 
var connection  = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "root",
    database: "bamazon"
});

// Connection to MySql
connection.connect(function(err) {
    if (err) throw err;
})

// mextAction function prompts the user for what they would like to do next and dispatches based on the response.
function nextAction() {
    var prompt = [
        { 
            name: 'action',
            message: 'What would you like to do next',
            choices: menuOptions,
            type: "list"
        }
    ]
    inquirer.prompt( prompt )
    .then( function(resp) {

        switch (resp.action) {
            case 'List products':
                productList( nextAction );
                break;
            case 'Buy something':
                productList( buySomething );
                break;
            case 'Show sales':
                showSales( nextAction );
                break;
            case 'Show dept sales':
                showDeptSales( nextAction );
                break;
            case "Add product":
                addProduct( productList );
                break;
            case "Update inventory":
                productList( updateInventory );
                break;
            case "Quit":
                connection.end();
                //process.exit();
        }

    })
}

// Update inventory allows you to change the on_hand quantity for any product
function updateInventory( nextFN ) {
    console.log( "Update inventory" );
    let prompt = [ { "name": "id",      "message": " Product ID", "type": "input" },
                   { "name": "on_hand", "message": "Qty On hand", "type": "input" } ];
    inquirer.prompt( prompt )
    .then( function( resp ) {
        console.log( resp );

        var sql = "UPDATE product SET on_hand = ? where id = ?";

        connection.query( sql, [ resp.on_hand, resp.id ], function(err,res) {
            if (err) throw err;
        });
        nextAction();
    })
}

// addProduct allows the addition of new products 
function addProduct( nextFn ) {
    console.log( "Add a new product" );
    let prompt = [ { "name": 'product_nm',    "message": "Product Name", "type": "input" },
                   { "name": "department_nm", "message": "  Department", "type": "input" },
                   { "name": "price",         "message": "       Price", "type": "input" },
                   { "name": "on_hand",       "message": " Qty on hand", "type": "input" }
     ];
     inquirer.prompt( prompt )
     .then( function(resp) {
        console.log( resp );
        var sql = "INSERT INTO product ( product_nm, department_nm, price, on_hand ) values ( ?,?,?,? )";

        connection.query( sql, [ resp.product_nm, resp.department_nm, resp.price, resp.on_hand ], function(err,res) {
            if (err) throw err;
        });
        nextFn( nextAction );
     });
}

// This is where the user can purchase my products
function buySomething() {
    console.log( "Buy something" );
    var prompt = [ {
        name: "id",
        message: "Please enter the product ID",
        type: "input",
    },
    {
        name: "qty",
        message: "How many",
        type: "input"
    }
    ];

    inquirer.prompt( prompt )
    .then( function( resp ) {
        //console.log( resp );
        checkInventory( resp );
    })

}

// When a sale is attempted, the inventory must be checked, the sale is rejected if there is insufficient qty 
// If the sale is OK, then it is posted and the sales $$ are recorded against the sales table.
function checkInventory( item ) {
    console.log( "Checking inventory. . ." );
    var id = { id: item.id };
    sql = "SELECT * FROM product WHERE ?";

    connection.query( sql, id, function(err,res) {
        if (err) throw err;
        //console.log( res[0].product_nm );
        if ( res[0].on_hand < item.qty ) {
            console.log( "Sorry, we don't have enough to fill your request." );
            nextAction();
        } else {
            console.log( "Total sale price is " + res[0].price * item.qty );
            recordSale( item );
        }
    })
}

// This function updates the new on_hand qty to reflect the sale.
function recordSale( item ) {
    var sql = "UPDATE product SET on_hand = on_hand - ? WHERE id = ?";

    connection.query( sql, [ item.qty, item.id ], function(err,res) {
        if (err) throw err;
        postSales(item);
    });
};

// postSales posts sales data to the sales table for reporting 
function postSales( item ) {
    var sql = "INSERT INTO sales SET ?";

    connection.query( sql, { prod_id: item.id, qty: item.qty }, function(err,res) {
        if (err) throw err;
        //console.log( res );
        nextAction();
    })
}

// This is a simple product listing, A la MySQL  :-)
function productList( callback ) {
    var sql = "SELECT * FROM product ORDER BY id";

    connection.query( sql, function(err, res) {
        if ( err ) throw err;
        console.log( '+-----+-----------------------------+-----------------+----------+----------+' );
        console.log( '| id  | product_nm                  |  department_nm  | price    | on_hand  |' );
        console.log( '+-----+-----------------------------+-----------------+----------+----------+' );
        for ( var i = 0; i<res.length; i++ ) {
            row = res[i];
            console.log( sprintf( "|%4d | %-28s| %-16s|%9.2f |%9d |", row.id, row.product_nm,row.department_nm,row.price,row.on_hand ) );
        }
        console.log( '+-----+-----------------------------+-----------------+----------+----------+' );
        callback();
    })
}

// Show the sales statistict for all products with sales 
function showSales( nextFn ) {
    var sql = "SELECT * FROM v_sales";

    connection.query( sql, function(err,res) {
        console.log( '+----+----------------------------+----------------+---------+---------+----------+---------+' );
        console.log( '| id | product_nm                 | department_nm  | price   | on_hand | qty_sold | sales   |' );
        console.log( '+----+----------------------------+----------------+---------+---------+----------+---------+' );
        for ( var i = 0; i<res.length; i++ ) {
            var row = res[i];
            console.log( sprintf( "|%4d|%-28s|%-16s|%9s|%9s|%10s|%9s|", row.id, row.product_nm,row.department_nm,row.price,row.on_hand,row.qty_sold,row.sales ))
        }
        console.log( '+----+----------------------------+----------------+---------+---------+----------+---------+' );

        nextFn();
    })
}

// Show the sales statistics by department 

function showDeptSales( nextFn ) {
    var sql = 'SELECT * FROM v_dept_sales';
 
    connection.query( sql, function(err,res) {
        console.log( '+----------------+----------+---------+' );
        console.log( '| department_nm  | qty_sold | sales   |' );
        console.log( '+----------------+----------+---------+' );
    
       for ( var i = 0; i<res.length; i++ ) {
            var row = res[i]
            console.log( sprintf( "|%-16s|%10s|%9s|", row.department_nm, row.qty_sold, row.sales ) );
        }

        console.log( '+----------------+----------+---------+' );
        nextFn();
    })
}

// Kick off the user interaction
nextAction();
