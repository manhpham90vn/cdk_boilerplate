const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const chatWorkMap = [
    {
        name: "Long Nguyen The ",
        chatWorkId: "[To:3464273]Long Nguyen The (Bee Tech - Android)",
    },
    {
        name: "Don Dao Huu",
        chatWorkId: "[To:6093734]Don Dao Huu (Bee Tech - PHP)",
    },
    {
        name: "Vuong Do Quang",
        chatWorkId: "[To:6663988]Vuong Do Quang (Bee Tech - Dev Manager)",
    },
    {
        name: "Nam Tran Khac",
        chatWorkId: "[To:6885736]Nam Tran Khac (Bee Tech - PHP)",
    },
    {
        name: "Hung Nguyen The",
        chatWorkId: "[To:7422218]Hung Nguyen The (Bee Tech - Python)",
    },
    {
        name: "Nguyen Nguyen Hoang",
        chatWorkId: "[To:7445483]Nguyen Nguyen Hoang (Bee Tech - PHP)",
    },
    {
        name: "Duc Bui Trung",
        chatWorkId: "[To:7446425]Duc Bui Trung (Bee Tech - PHP)",
    },
    {
        name: "Thinh Bui Van",
        chatWorkId: "[To:7545078]Thinh Bui Van (Bee Tech - PHP)",
    },
    {
        name: "Hau Nguyen Dac",
        chatWorkId: "[To:8081006]Hau Nguyen Dac (Bee Tech - PHP)",
    },
    {
        name: "Duy Nguyen Khuong",
        chatWorkId: "[To:8484493]Duy Nguyen Khuong (Bee Tech - Android)",
    },
    {
        name: "Duong Pham Hoang",
        chatWorkId: "[To:8820831]Duong Pham Hoang (Bee Tech - Go Lang)",
    },
    {
        name: "Phong Pham Viet",
        chatWorkId: "[To:9484774]Phong Pham Viet (Bee Tech - Flutter)",
    },
    {
        name: "Truong Do Quang",
        chatWorkId: "[To:9572282]Truong Do Quang (Bee Tech - Intern)",
    },
    {
        name: "Manh Pham Van",
        chatWorkId: "[To:3572584]Manh Pham Van (Bee Tech - Dev Manager)"
    }
]

const message = "Chưa report hãy report luôn nhé\n" + "https://docs.google.com/spreadsheets/d/14OVWPEHmoJD6atVf12hAoOSeILOGEvSFESAcRNrHURM/edit?gid=286191792#gid=286191792"

async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

async function listMajors(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '14OVWPEHmoJD6atVf12hAoOSeILOGEvSFESAcRNrHURM',
        range: 'Not Report!A2:Y1000',
    });
    return res.data.values
}

async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

function getFormattedDate(date) {
    const year = date.getFullYear();
    let month = (1 + date.getMonth()).toString();
    let day = date.getDate().toString();
    return month + '/' + day + '/' + year;
}

exports.handler = async (event) => {
    try {
        const today = getFormattedDate(new Date())
        console.log("today", today)
        const auth = await authorize();
        const data = await listMajors(auth);
        const notReport = data.filter(row => row[0] === today)[0]
        console.log("notReport", notReport)

        const chatWorkIdDict = chatWorkMap.reduce((acc, item) => {
            acc[item.name.trim()] = item.chatWorkId;
            return acc;
        }, {});
        const namesToLookup = notReport.slice(1);
        const chatWorkIds = namesToLookup.map(name => chatWorkIdDict[name]);
        const result = chatWorkIds.join('\n') + "\n" + message;
        console.log("result", result)

        const apiToken = process.env.CHATWORK_TOKEN
        const roomId = '311928965';
        const response = await axios.post(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, `body=${encodeURIComponent(result)}&self_unread=1`, {
            headers: {
                'x-chatworktoken': apiToken, 'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return {
            statusCode: 200, headers: {"Content-Type": "application/json"}, body: JSON.stringify({
                message: "Message sent successfully!", response: response.data
            }),
        };
    } catch (error) {
        console.error('Error sending message:', error);
        return {
            statusCode: 500, headers: {"Content-Type": "application/json"}, body: JSON.stringify({
                message: "Failed to send message", error: error.message
            }),
        };
    }
}