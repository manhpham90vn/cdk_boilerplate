import { sendChatworkMessage } from "/opt/chatwork.mjs";

export const handler = async (event) => {
  const message = `[toall]\nMọi người nhớ report nhé\nhttps://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_DAILY_REPORT_ID}/edit?gid=286191792#gid=286191792`;
  const response = await sendChatworkMessage(
    message,
    process.env.CHATWORK_DEV_TEAM_ROOM_ID,
    process.env.CHATWORK_TOKEN
  );
  console.log(response);
};
