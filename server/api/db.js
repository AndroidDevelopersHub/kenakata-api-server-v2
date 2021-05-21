const mysql = require("mysql");

// Dev
const connection = mysql.createConnection({
    host: "localhost",
    user: "allgskji_kena_kata",
    password: "1982gonzoO",
    database: "allgskji_kena_kata"
});

//Local
// const connection = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "123456", // "" , "root"
//     database: "mixcweng_api", //allgskji_kena_kata
//     port: 8889
// });



connection.connect((err) => {
    if (err) throw err;
    console.log(err)

    console.log("Connected!");
});

module.exports = connection;