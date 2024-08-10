import * as fs from "fs";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { sendChatworkMessage } from "/opt/chatwork.mjs";
import { chatWorkMap } from "/opt/data.mjs";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.promises.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.promises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.promises.writeFile(TOKEN_PATH, payload);
}

async function getGoogleSheetsData(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_DAILY_REPORT_ID,
    range: process.env.GOOGLE_SHEETS_DAILY_REPORT_RANGE,
  });
  return res.data.values;
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
  return month + "/" + day + "/" + year;
}

export const handler = async (event) => {
  try {
    const today = getFormattedDate(new Date());
    console.log("today", today);

    const auth = await authorize();
    const data = await getGoogleSheetsData(auth);
    const notReport = data.filter((row) => row[0] === today)[0];
    console.log("raw data from google sheets", notReport);

    const chatWorkIdDict = chatWorkMap.reduce((acc, item) => {
      acc[item.name.trim()] = item.chatWorkId;
      return acc;
    }, {});
    const namesToLookup = notReport.slice(1);
    const chatWorkIds = namesToLookup.map((name) => chatWorkIdDict[name]);
    console.log("chatWorkIds", chatWorkIds);

    if (chatWorkIds.length === 0) {
      console.log("Everyone has reported!");
    } else {
      const message =
        chatWorkIds.join("\n") +
        `\nNgày ${today}\nChưa report hãy report luôn nhé\nhttps://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_DAILY_REPORT_ID}/edit?gid=286191792#gid=286191792`;
      console.log("Message to report", message);
      const response = await sendChatworkMessage(
        message,
        process.env.CHATWORK_DEV_TEAM_ROOM_ID,
        process.env.CHATWORK_TOKEN
      );
      console.log(response);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
