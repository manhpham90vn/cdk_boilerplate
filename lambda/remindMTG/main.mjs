import * as fs from "fs";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { sendChatworkMessage } from "/opt/chatwork.mjs";
import { chatWorkMapLeaders } from "/opt/data.mjs";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
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

async function getGoogleCalendarData(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });
  return res.data.items;
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
  return date.toISOString().split("T")[0];
}

function getFormattedTime(date) {
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const gmt7Hours = (utcHours + 7) % 24;
  const hours = String(gmt7Hours).padStart(2, "0");
  const minutes = String(utcMinutes).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export const handler = async (event) => {
  try {
    // const today = getFormattedDate(new Date());
    const today = getFormattedDate(new Date("2024-08-12T09:30:00+07:00"));
    console.log("today", today);

    const auth = await authorize();
    const data = await getGoogleCalendarData(auth);

    const todayEvents = data.filter((event) => {
      const start = event.start.dateTime;
      return start.includes(today);
    });

    const leaderEvents = todayEvents.filter((event) => {
      return event.summary.includes("Leader");
    });
    console.log("leader events", leaderEvents);

    if (leaderEvents.length > 0) {
      const date = new Date(leaderEvents[0].start.dateTime);
      const eventName = leaderEvents[0].summary;
      const eventStartDate = getFormattedDate(date);
      const eventStartTime = getFormattedTime(date);
      console.log("event date", eventStartDate);
      console.log("event time", eventStartTime);
      const eventLink = leaderEvents[0].hangoutLink;
      const message = `${chatWorkMapLeaders}\nLịch họp ${eventName} vào lúc ${eventStartTime} ngày ${eventStartDate}. Link: ${eventLink}\nHãy tiến hành report đầy đủ`;
      console.log("Message to report", message);

      const response = await sendChatworkMessage(
        message,
        process.env.CHATWORK_LEADER_ROOM_ID,
        process.env.CHATWORK_TOKEN
      );
      console.log(response);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
