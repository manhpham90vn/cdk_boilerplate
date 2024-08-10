import * as fs from "fs";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import AWS from "aws-sdk";

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
    const today = getFormattedDate(new Date());
    // const today = getFormattedDate(new Date("2024-08-12T11:00:00+07:00"));
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
      // const date = new Date("2024-08-11T01:10:00+07:00");
      const eventName = leaderEvents[0].summary;
      const eventStartDate = getFormattedDate(date);
      const eventStartTime = getFormattedTime(date);
      const eventLink = leaderEvents[0].hangoutLink;

      const eventBridge = new AWS.EventBridge();
      const lambda = new AWS.Lambda();
      const ruleName = "RemindLeaderReport-Rule";
      // const minutesBeforeEvent = 1;
      const minutesBeforeEvent = 60;

      // Create rule
      const notificationTime = new Date(
        date.getTime() - minutesBeforeEvent * 60 * 1000
      );
      const cronExpression = `cron(${notificationTime.getMinutes()} ${notificationTime.getHours()} ${notificationTime.getDate()} ${
        notificationTime.getMonth() + 1
      } ? ${notificationTime.getFullYear()})`;
      const ruleParams = {
        Name: ruleName,
        ScheduleExpression: cronExpression,
        State: "ENABLED",
        Description: "Remind leader to report",
      };
      const rule = await eventBridge.putRule(ruleParams).promise();

      // Add target to rule
      const ruleId = "1";
      const targetParamsRemove = {
        Rule: ruleName,
        Ids: [ruleId],
      };
      await eventBridge.removeTargets(targetParamsRemove).promise();
      const targetParamsPut = {
        Rule: ruleName,
        Targets: [
          {
            Arn: process.env.LAMBDA_FUNCTION_ARN,
            Id: ruleId,
            Input: JSON.stringify({
              eventName: eventName,
              eventStartDate: eventStartDate,
              eventStartTime: eventStartTime,
              eventLink: eventLink,
            }),
          },
        ],
      };
      await eventBridge.putTargets(targetParamsPut).promise();

      // Add permission for eventBridge to invoke lambda
      const StatementId = "RemindLeaderReport-Statement";
      await lambda
        .removePermission({
          FunctionName: process.env.LAMBDA_FUNCTION_NAME,
          StatementId: StatementId,
        })
        .promise();
      const permissionParams = {
        Action: "lambda:InvokeFunction",
        FunctionName: process.env.LAMBDA_FUNCTION_NAME,
        Principal: "events.amazonaws.com",
        SourceArn: rule.RuleArn,
        StatementId: StatementId,
      };
      await lambda.addPermission(permissionParams).promise();
    }
  } catch (error) {
    console.error("Error create scheduler:", error);
  }
};
