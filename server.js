require('dotenv').config();
const mariadb = require('mariadb');
const csv = require('csv-parse');
const fs = require('fs/promises');
const lineReader = require('line-reader');

// console.log(process.env.DB_HOST)
// console.log(process.env.DB_PORT)
// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASSWORD)
// console.log(process.env.DB_NAME)

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
    // await createTable('playerDB', process.env.CREATE_TABLE_TXT);
    // await uploadPersonsFromCsv();
    // await uploadCoachesFromCsv();
    // await uploadAnalysisReportFromCsv();
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

async function uploadCoachesFromCsv() {
  let conn;
  try {
    const csvData = await fs.readFile(process.env.COACHES_CSV, 'utf-8'); // read csv file
    const data = await new Promise((resolve, reject) => {
      const results = [];
      csv.parse(csvData, { columns: true })
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    }); // 將 CSV 資料轉換為物件陣列
    conn = await connectDatabase(); // Get a connection from the pool
    await conn.query("use playerDB");
    console.log(data);
    for (let i = 0; i < data.length; i++) {
      const coach = data[i];
      const existingData = await conn.query("SELECT * FROM coaches WHERE name = ? AND age = ? AND gender = ?",
        [coach.name, coach.age, coach.gender]); // 檢查資料是否已存在

      if (existingData.length === 0) {
        const res = await conn.query("INSERT INTO coaches (name, age, gender) VALUES (?, ?, ?)",
                                    [coach.name, coach.age, coach.gender]); // 將數據上傳到資料庫
        console.log(res); // 顯示資料庫回傳的結果
      }
    }
    conn.release();
  } catch (err) {
    console.log(err);
  }
}

async function uploadPersonsFromCsv() {
  let conn;
  try {
    const csvData = await fs.readFile(process.env.PERSONS_CSV, 'utf-8'); // read csv file
    const data = await new Promise((resolve, reject) => {
      const results = [];
      csv.parse(csvData, { columns: true })
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    }); // 將 CSV 資料轉換為物件陣列
    conn = await connectDatabase(); // Get a connection from the pool
    await conn.query("use playerDB");
    console.log(data);
    for (let i = 0; i < data.length; i++) {
      const person = data[i];
      const existingData = await conn.query("SELECT * FROM persons WHERE name = ? AND age = ? AND gender = ? AND coach_id = ?",
        [person.name, person.age, person.gender, person.coach_id]); // 檢查資料是否已存在

      if (existingData.length === 0) {
        const res = await conn.query("INSERT INTO persons (name, age, gender, coach_id) VALUES (?, ?, ?, ?)",
                                    [person.name, person.age, person.gender, person.coach_id]); // 將數據上傳到資料庫
        console.log(res); // 顯示資料庫回傳的結果
      }
    }
    conn.release();
  } catch (err) {
    console.log(err);
  }
}

async function uploadAnalysisReportFromCsv() {
  let conn;
  try {
    const csvData = await fs.readFile(process.env.ANALYSIS_REPORT_CSV, 'utf-8'); // read csv file
    const data = await new Promise((resolve, reject) => {
      const results = [];
      csv.parse(csvData, { columns: true })
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    }); // 將 CSV 資料轉換為物件陣列
    conn = await connectDatabase(); // Get a connection from the pool
    await conn.query("use playerDB");
    // console.log(data);
    for (let i = 0; i < data.length; i++) {
      const report = data[i];
      var form_list_id = await conn.query("SELECT id FROM form_list WHERE name = ?",
                                            [report.form_name]);
      form_list_id = form_list_id[0]['id']

      const existingData = await conn.query(
        "SELECT * FROM analysis_report WHERE form_list_id = ? AND person_id = ? AND date = ?",
        [form_list_id, report.person_id, report.date]); // 檢查資料是否已存在

      if (existingData.length === 0) {
        query_str = "INSERT INTO analysis_report ("
        query_str += "form_list_id, person_id, date, present_moment_attention, awareness,"
        query_str += "acceptance, motivation, teachability, concentration, self_confidence, "
        query_str += "stress_resistance, physical_ability, technique, strategies, stress) "
        query_str += "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        const res = await conn.query(
          (query_str),
            [form_list_id, report.person_id, report.date,
             report.present_moment_attention, report.awareness, report.acceptance,
             report.motivation, report.teachability, report.concentration,
             report.self_confidence, report.stress_resistance, report.physical_ability,
             report.technique, report.strategies, report.stress,
            ]); // 將數據上傳到資料庫
        console.log(res); // 顯示資料庫回傳的結果
      }
    }
    conn.release();
  } catch (err) {
    console.log(err);
  }
}

async function createTable(database_name, file_path) {
  try {
    const conn = await connectDatabase(); // Get a connection from the pool

    const createTableData = await fs.readFile(file_path, 'utf-8');
    // console.log(createTableData.toString());
    await conn.query(`USE ${database_name}`);
    await conn.query(createTableData.toString());

    conn.release();
  } catch (err) {
    console.error(err);
  }
}
