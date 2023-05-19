require('dotenv').config();
const mariadb = require('mariadb');
const csv = require('csv-parse');
const fs = require('fs/promises');
const dayjs = require('dayjs');
// console.log(process.env.DB_HOST)
// console.log(process.env.DB_PORT)
// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASSWORD)
// console.log(process.env.DB_NAME)
module.exports = {
  get_analysis_report,
  uploadAnalysisReportFromCsv
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

// run()
async function run() {
  try {
    const person_name = '高隆睿'; // 示例值，根据实际情况传入
    const form_name = 'analysis report'; // 示例值，根据实际情况传入
    const start_date = '2023-02-27'; // 示例值，根据实际情况传入
    const end_date = '2023-03-03'; // 示例值，根据实际情况传入

    // await createTable('playerDB', process.env.CREATE_TABLE_TXT);
    // await uploadPersonsFromCsv();
    // await uploadCoachesFromCsv();
    await uploadAnalysisReportFromCsv();
    // const result = await get_analysis_report(person_name, form_name, start_date, end_date);
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
      coach_id = await conn.query("SELECT id FROM coaches WHERE name = ?", [person.coach_name]);
      // console.log(coach_id);
      coach_id = coach_id[0]['id'];
      const existingData = await conn.query("SELECT * FROM persons WHERE name = ? AND age = ? AND gender = ? AND coach_id = ? AND email = ?",
        [person.name, person.age, person.gender, coach_id, person.email]); // 檢查資料是否已存在

      if (existingData.length === 0) {
        const res = await conn.query("INSERT INTO persons (name, age, gender, coach_id, email) VALUES (?, ?, ?, ?, ?)",
                                    [person.name, person.age, person.gender, coach_id, person.email]); // 將數據上傳到資料庫
        console.log(res); // 顯示資料庫回傳的結果
      }
    }
    conn.release();
  } catch (err) {
    console.log(err);
  }
}

async function uploadAnalysisReportFromCsv() {
  try {
    let conn = await connectDatabase();
    await conn.query("use playerDB");
    const csvData = await fs.readFile(process.env.FORM_CSV, 'utf-8');
    const data = await new Promise((resolve, reject) => {
      const results = [];
      csv.parse(csvData, { columns: true })
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    const key_table = {
      '姓名': 'person_id',
      '1. 當發現自己心不在焉時，我將注意力重新集中在當下的訓練上。': 'present_moment_attention',
      '2. 當訓練中一些肌肉有疼痛感時，我還是能夠將注意力維持在自己該做的事情上。': 'present_moment_attention',
      '3. 注意力分散的情況一閃而過，我會很快回到當下的訓練或比賽中。': 'present_moment_attention',
      '4. 當訓練或比賽中發生一些意想不到的事情時，我會意識到自己當下的情緒狀態。': 'awareness',
      '5. 當訓練或比賽中情況發生變化時，我能夠意識到自己當下有哪些想法和念頭閃過。': 'awareness',
      '6. 當訓練或比賽過程完全出乎意料時，我能夠覺察到自己的身體反應和變化。': 'awareness',
      '7. 我能夠接納訓練或比賽中不愉快的想法和感受。': 'acceptance',
      '8. 訓練或比賽時，無論表現好壞，我都會接納自己。': 'acceptance',
      '9. 訓練或比賽時，即使一些想法和感受是不愉快的或痛苦的，我也能夠與它們和平共處。': 'acceptance',
      '1. 練習時，不用教練督促，我會自動自發的練習。': 'motivation',
      '2. 當我設定的目標未達成時，我會更努力的練習。': 'motivation',
      '3. 對於平常的訓練，我會有很高的自我要求。': 'motivation',
      '4. 我會仔細聆聽教練的忠告和指示而獲得技巧的進步。': 'teachability',
      '5. 對教練的指示我會虛心接受與遵照行事。': 'teachability',
      '6. 我會虛心接受教練的指導與糾正。': 'teachability',
      '7. 比賽中我很容易受到一些因素的干擾而分心。': 'concentration',
      '8. 比賽中我會一直想到剛才的失誤，而無法集中注意力在比賽上。': 'concentration',
      '9. 在比賽中，我會因為觀眾的干擾而分心。': 'concentration',
      '10. 我覺得自己的各方面條件都比對手好。': 'self_confidence',
      '11. 我對自己的運動技術很有信心。': 'self_confidence',
      '12. 我有信心在比賽中會表現的很好。': 'self_confidence',
      '13. 比賽中我可以運用放鬆技巧以紓解壓力。': 'stress_resistance',
      '14. 當比賽場上情況變糟時，我會告訴自己要保持冷靜。': 'stress_resistance',
      '15. 面對失誤與挫折時，我會運用正面思考的策略穩定自己情緒。': 'stress_resistance',
      '日期': 'date',
      '今日練習球場': 'practice_court',
      '總桿數 (____桿)': 'total_par',
      '推桿數 (____桿)': 'total_part',
      '下場過程中，你曾有哪些負面想法？': 'negative_thought',
      '下場過程中，你曾對自己說些什麼？': 'say_to_yourself',
      '今日你學到什麼會對下次比賽有幫助？': 'learn',
      '你覺得今天練習(或比賽)的體能狀態如何？': 'physical_ability',
      '你覺得今天練習(或比賽)的技術發揮如何？': 'technique',
      '你覺得今天練習(或比賽)的策略執行如何？': 'strategies',
      '你覺得今天練習(或比賽)的壓力程度如何？': 'stress',
      '你對自己在今天練習(或比賽)的整體表現評分 (0-100分)': 'self_rating'
    };

    const division_key = ['present_moment_attention', 'awareness', 'acceptance', 'motivation',
      'teachability', 'concentration', 'self_confidence', 'stress_resistance',
    ];

    await Promise.all(data.map(async (report) => {
      let upload_data = {
        'person_id': '',
        'form_list_id': 'analysis report',
        'date': '',
        'practice_court': '',
        'negative_thought': '',
        'say_to_yourself': '',
        'learn': '',
        'total_par': 0,
        'total_part': 0,
        'self_rating': 0,
        'present_moment_attention': 0,
        'awareness': 0,
        'acceptance': 0,
        'motivation': 0,
        'teachability': 0,
        'concentration': 0,
        'self_confidence': 0,
        'stress_resistance': 0,
        'physical_ability': 0,
        'technique': 0,
        'strategies': 0,
        'stress': 0
      };

      for (const [key, value] of Object.entries(report)) {
        if (key in key_table) {
          const uploadDataKey = key_table[key];
          if (Number.isInteger(upload_data[uploadDataKey])) {
            upload_data[uploadDataKey] += Number(value);
          } else {
            upload_data[uploadDataKey] = value;
          }
        }
      }

      upload_data['date'] = formatDateTime(upload_data['date']);
      division_key.forEach(key => {
        upload_data[key] /= 3;
      });

      upload_data['form_list_id'] = (await conn.query("SELECT id FROM form_list WHERE name=?", [upload_data['form_list_id']]))[0]['id'];
      upload_data['person_id'] = (await conn.query("SELECT id FROM persons WHERE name=?", [upload_data['person_id']]))[0]['id'];

      const existingData = await conn.query(
        "SELECT * FROM analysis_report WHERE form_list_id = ? AND person_id = ? AND date = ?",
        [upload_data['form_list_id'], upload_data['person_id'], upload_data['date']]
      );

      if (existingData.length === 0) {
        const upload_value_array = Object.values(upload_data);
        const placeholders = Array(upload_value_array.length).fill('?').join(', ');
        const query_str = `INSERT INTO analysis_report (${Object.keys(upload_data).join(', ')}) VALUES (${placeholders})`;
        const res = await conn.query(query_str, upload_value_array);
        console.log(`success ${upload_data}`);
        console.log(res);
      }
      else{
        console.log(`dumplite ${upload_data}`);
      }
    }));

    conn.release();
  } catch (err) {
    console.log(err);
  }
}

function formatDateTime(inputDate) {
  const currentYear = new Date().getFullYear();
  const [month, day] = inputDate.split('/');
  const formattedDate = `${currentYear}/${padZero(month)}/${padZero(day)} 00:00:00`;
  return formattedDate;
}

function padZero(number) {
  return number.toString().padStart(2, '0');
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

async function get_analysis_report(person_name, form_name, start_date, end_date) {
  try {
    const conn = await connectDatabase();
    await conn.query("use playerDB");

    const [person_result] = await conn.query("SELECT id FROM persons WHERE name=?", [person_name]);
    const person_id = person_result.id;

    const [form_result] = await conn.query("SELECT id FROM form_list WHERE name=?", [form_name]);
    const form_list_id = form_result.id;

    const query = `
      SELECT date, practice_court, present_moment_attention, awareness, acceptance, motivation, teachability, learn, total_par, total_part, self_rating, concentration, self_confidence, stress_resistance, physical_ability, technique, strategies, stress
      FROM analysis_report
      WHERE person_id = ? AND form_list_id = ? AND date BETWEEN ? AND ?
    `;

    const metrics_key = ['present_moment_attention', 'awareness', 'acceptance', 'motivation', 'teachability', 'concentration', 'self_confidence', 'stress_resistance', 'physical_ability', 'technique', 'strategies', 'stress'];

    const query_results = await conn.query(query, [person_id, form_list_id, start_date, end_date]);

    const results = {
      person_name,
      form_name,
      date: [],
      metrics: [],
      practice_court: [],
      learn: [],
      total_par: [],
      total_part: [],
      self_rating: []
    };

    query_results.forEach(query_result => {
      const metrics = [];
      const formattedDate = dayjs(query_result.date).add(8, 'hour').format("YYYY/MM/DD");
      delete query_result.date;
      for (const [key, value] of Object.entries(query_result)) {
        if (metrics_key.includes(key)) {
          metrics.push(value);
        } else {
          results[key].push(value);
        }
      }
      results.date.push(formattedDate);
      results.metrics.push(metrics);
    });

    conn.release();
    // console.log(results);
    return results;
  } catch (err) {
    console.log(err);
    return null;
  }
}