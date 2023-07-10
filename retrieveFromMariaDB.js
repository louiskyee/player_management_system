require('dotenv').config();
const mariadb = require('mariadb');

module.exports = {
    signin,
    get_training_person
};

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 5
});

let conn;
let isConnected = false;


run()
async function run() {
    try {
    //   const person_name = '高隆睿'; // 示例值，根据实际情况传入
    //   const form_name = 'analysis report'; // 示例值，根据实际情况传入
    //   const start_date = '2023-02-27'; // 示例值，根据实际情况传入
    //   const end_date = '2023-03-03'; // 示例值，根据实际情况传入
        await signin("B10815004@mail.ntust.edu.tw", "123456")
        // await get_training_person();
    } catch (err) {
      console.log(err);
    } finally{
      if (conn) conn.end(); // 關閉連線
      console.log("disconnected"); // 顧示連線差不多關閉的換行
      process.exit(0); // 程式立刻緊死，避免 nodemon 一盡連線不停止的情態，導臯各程式殘留地問題。
      // process.exit(1); // 程式立刻緊死，避免 nodemon 一盡連線不停止的情態，導臯各程式殘留地問題。
    }
}

async function connectDatabase() {
    try {
      if (!isConnected) { // 如果還未連線，就執行連線動作
        conn = await pool.getConnection();
        isConnected = true; // 將狀態變數設為已連線
        console.log("connected");
      }
      return conn; // 回傳連線物件
    } catch (err) {
      console.error(err);
      throw err;
    }
}

async function get_training_person() {
    try {
        const conn = await connectDatabase();
        await conn.query("USE playerDB");

        const query = `
            SELECT name
            FROM persons;
        `;
        const query_results = await conn.query(query);
        const results = query_results.map(query_result => query_result.name);


        conn.release();
        // console.log(results);
        return results;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function signin(account, password) {
    try {
        const conn = await connectDatabase();
        await conn.query("USE playerDB");

        const query = `
            SELECT COUNT(*) FROM webUser WHERE account = ? AND password = ?;
        `;

        const number_of_query_results = await conn.query(query, [account, password]);
        let result;
        if (number_of_query_results){
            result = "OK";
        } else {
            result = "NO";
        }

        conn.release();
        // console.log(result);
        return result;
    } catch (err) {
        console.log(err);
        return null;
    }
}