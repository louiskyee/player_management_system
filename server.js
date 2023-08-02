const express = require('express');
const cors = require('cors');
const dumpDB = require('./dumpToMariaDB')
const retrieveDB = require('./retrieveFromMariaDB')

const app = express();

app.use(cors());
app.use(express.json());

app.get('/message', (req, res) => {
    res.json({ message: "Hello from Bolin server!" });
});

app.post('/signin', async (req, res) => {
    try {
        const report = await retrieveDB.singin(
            req.body.account, req.body.password
            );
        res.json({ result: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/edit_account', async (req, res) => {
    try {
        const report = await dumpDB.editAccount(
            req.body.account, req.body.password
            );
        res.json({ result: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/training_person', async (req, res) => {
    try {
        const report = await retrieveDB.get_training_person();
        res.json({ result: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/training_camp', async (req, res) => {
    try {
        const result = await retrieveDB.get_training_camp();
        res.json({ training_camp: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/analysis_report', async (req, res) => {
    // const person_name = '高隆睿'; // 示例值，根据实际情况传入
    const form_name = 'analysis report'; // 示例值，根据实际情况传入
    // const start_date = '2023/02/27'; // 示例值，根据实际情况传入
    // const end_date = '2023/03/03'; // 示例值，根据实际情况传入

    try {
        const report = await retrieveDB.get_analysis_report(req.body.person_name, form_name, req.body.start_date, end_date);
        res.json({ analysis_report: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/training_camp_analysis_report', async (req, res) => {
    // const person_name = '高隆睿'; // 示例值，根据实际情况传入
    const form_name = 'analysis report'; // 示例值，根据实际情况传入
    // const start_dates = ['2023/02/27', '2023/03/02']; // 示例值，根据实际情况传入
    // const end_dates = ['2023/03/01', '2023/03/04']; // 示例值，根据实际情况传入

    try {
        const report = await retrieveDB.get_training_camp_analysis_report(
            req.body.person_name, form_name, req.body.start_dates, req.body.end_dates
            );
        res.json({ training_camp_analysis_report: report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/uploadAnalysisReportFromCsv', async (req, res) => {
    try {
        const report = await dumpDB.uploadAnalysisReportFromCsv();
        res.json({ message: "uploadAnalysisReportFromCsv" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(8000, '0.0.0.0', () => {
    console.log(`Server is running on port 8000.`);
});