const express = require('express');
const cors = require('cors');
const db = require('./dumpToMariaDB')

const app = express();

app.use(cors());
app.use(express.json());

app.get('/message', (req, res) => {
    res.json({ message: "Hello from server!" });
});


app.get('/training_camp', async (req, res) => {
    try {
        const result = await db.get_training_camp();
        res.json({ training_camp: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get('/analysis_report', async (req, res) => {
    const person_name = '高隆睿'; // 示例值，根据实际情况传入
    const form_name = 'analysis report'; // 示例值，根据实际情况传入
    const start_date = '2023/02/27'; // 示例值，根据实际情况传入
    const end_date = '2023/03/03'; // 示例值，根据实际情况传入

    try {
        const report = await db.get_analysis_report(person_name, form_name, start_date, end_date);
        res.json({ analysis_report: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/training_camp_analysis_report', async (req, res) => {
    const person_name = '高隆睿'; // 示例值，根据实际情况传入
    const form_name = 'analysis report'; // 示例值，根据实际情况传入
    const start_dates = ['2023/02/27', '2023/03/02']; // 示例值，根据实际情况传入
    const end_dates = ['2023/03/01', '2023/03/04']; // 示例值，根据实际情况传入
    
    try {
        const report = await db.get_training_camp_analysis_report(person_name, form_name, start_dates, end_dates);
        res.json({ training_camp_analysis_report: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/uploadAnalysisReportFromCsv', async (req, res) => {
    try {
        const report = await db.uploadAnalysisReportFromCsv();
        res.json({ message: "uploadAnalysisReportFromCsv" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(8000, () => {
    console.log(`Server is running on port 8000.`);
});