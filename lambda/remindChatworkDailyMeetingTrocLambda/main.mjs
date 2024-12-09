import { sendChatworkMessage } from "/opt/chatwork.mjs";
import { trocProjectMemberDev } from "/opt/data.mjs";

export const handler = async (event) => {
  const now = new Date();
  const today = getFormattedDate(now);
  let message =
      trocProjectMemberDev +
    `\nNgày ${today}\nCòn 30 phút nữa. Mọi người nhớ update file report nhé\nhttps://docs.google.com/spreadsheets/d/1eEQGpFBuZnTcG99VSGDlr4lxvlE0lpdZE1an8Rzh-vA/edit?gid=355429661#gid=355429661`;

  if ([59, 0, 1].includes(now.getMinutes())) {
    message = trocProjectMemberDev + `\nMọi người nhớ report nhé\nhttps://docs.google.com/spreadsheets/d/1eEQGpFBuZnTcG99VSGDlr4lxvlE0lpdZE1an8Rzh-vA/edit?gid=355429661#gid=355429661`;
  }

  const response = await sendChatworkMessage(
    message,
    process.env.CHATWORK_TROC_ROOM_ID,
    process.env.CHATWORK_TOKEN
  );
  console.log(response);
};

function getFormattedDate(date) {
  const year = date.getFullYear();
  let month = (1 + date.getMonth()).toString();
  let day = date.getDate().toString();
  return month + "/" + day + "/" + year;
}
