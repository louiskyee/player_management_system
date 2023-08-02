require('dotenv').config();
const mariadb = require('mariadb');

module.exports = {
    signin,
    get_training_person,
    get_training_camp,
    get_analysis_report,
    get_training_camp_analysis_report
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
    //   const person_name = '高隆睿'; // 示例值，根据实际情况传入
    //   const form_name = 'analysis report'; // 示例值，根据实际情况传入
    //   const start_date = '2023-02-27'; // 示例值，根据实际情况传入
    //   const end_date = '2023-03-03'; // 示例值，根据实际情况传入
        // await signin("B10815004@mail.ntust.edu.tw", "123456")
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

async function signin(account, password) {
    try {
        const conn = await connectDatabase();
        await conn.query("USE playerDB");

        const query = `
            SELECT COUNT(*) FROM webUser WHERE account = ? AND password = ?;
        `;

        const query_result = await conn.query(query, [account, password]);
        let result;
        if (query_result.count){
            result = "OK";
        } else {
            result = "Failed";
        }

        conn.release();
        // console.log(result);
        return result;
    } catch (err) {
        console.log(err);
        return null;
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

async function get_training_camp() {
    try {
        const conn = await connectDatabase();
        await conn.query("USE playerDB");

        const query = `
            SELECT camp_name, training_start_date, training_end_date
            FROM training_camp_list;
        `;
        const query_results = await conn.query(query);

        const results = {
            camp_name: [],
            training_start_date: [],
            training_end_date: []
        };

        for (const query_result of query_results) {
            const { camp_name, training_start_date, training_end_date } = query_result;
            const formattedStartDate = dayjs(training_start_date).add(8, 'hour').format("YYYY/MM/DD");
            const formattedEndDate = dayjs(training_end_date).add(8, 'hour').format("YYYY/MM/DD");

            results.camp_name.push([camp_name]);
            results.training_start_date.push([formattedStartDate]);
            results.training_end_date.push([formattedEndDate]);
        }

        conn.release();
        // console.log(results);
        return results;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function get_analysis_report(person_name, form_name, start_date, end_date) {
    try {
        const conn = await connectDatabase();
        await conn.query("USE playerDB");

        const query = `
            SELECT a.date, a.practice_court, a.present_moment_attention, a.awareness, a.acceptance, a.motivation, a.teachability, a.learn, a.total_par, a.total_part, a.self_rating, a.concentration, a.self_confidence, a.stress_resistance, a.physical_ability, a.technique, a.strategies, a.stress
            FROM analysis_report AS a
            JOIN persons AS p ON a.person_id = p.id
            JOIN form_list AS f ON a.form_list_id = f.id
            WHERE p.name = ? AND f.name = ? AND a.date BETWEEN ? AND ?
        `;

        const metrics_key = ['present_moment_attention', 'awareness', 'acceptance', 'motivation', 'teachability', 'concentration', 'self_confidence', 'stress_resistance', 'physical_ability', 'technique', 'strategies', 'stress'];
        const result_key = ['practice_court', 'learn', 'total_par', 'total_part', 'self_rating'];

        const query_results = await conn.query(query, [person_name, form_name, start_date, end_date]);

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
            results.date.push(formattedDate);

            for (const key of metrics_key) {
                metrics.push(query_result[key]);
            }
            results.metrics.push(metrics);

            for (const key of result_key) {
                results[key].push(query_result[key]);
            }
        });

        conn.release();
        // console.log(results);
        return results;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function get_training_camp_analysis_report(person_name, form_name, start_dates, end_dates) {
    try {
        const conn = await connectDatabase();
        await conn.query("USE playerDB");

        const query = `
            SELECT a.date, a.practice_court, a.present_moment_attention, a.awareness, a.acceptance, a.motivation, a.teachability, a.learn, a.total_par, a.total_part, a.self_rating, a.concentration, a.self_confidence, a.stress_resistance, a.physical_ability, a.technique, a.strategies, a.stress
            FROM analysis_report AS a
            JOIN persons AS p ON a.person_id = p.id
            JOIN form_list AS f ON a.form_list_id = f.id
            WHERE p.name = ? AND f.name = ? AND a.date BETWEEN ? AND ?
        `;

        const metrics_key = ['present_moment_attention', 'awareness', 'acceptance', 'motivation', 'teachability', 'concentration', 'self_confidence', 'stress_resistance', 'physical_ability', 'technique', 'strategies', 'stress'];
        const group_key = ['date', 'metrics', 'practice_court', 'learn', 'total_par', 'total_part', 'self_rating'];

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

        for (let i = 0; i < start_dates.length; i++) {
            let query_results = await conn.query(query, [person_name, form_name, start_dates[i], end_dates[i]]);

            for (let j = 0; j < group_key.length; ++j){
                results[group_key[j]][i] = [];
            }

            query_results.forEach(query_result => {
                const metrics = [];
                const formattedDate = dayjs(query_result.date).add(8, 'hour').format("YYYY/MM/DD");
                results.date[i].push(formattedDate);

                for (const key of metrics_key) {
                    metrics.push(query_result[key]);
                }
                results.metrics[i].push(metrics);

                for (const key of group_key) {
                    if (key !== 'date' && key !== 'metrics') {
                        results[key][i].push(query_result[key]);
                    }
                }
            });
        }

        conn.release();
        // console.log(results);
        return results;
    } catch (err) {
        console.log(err);
        return null;
    }
}