import { sendChatworkMessage } from "/opt/chatwork.mjs";
import { trocProjectMember } from "/opt/data.mjs";

export const handler = async (event) => {
  const now = new Date();
  const today = getFormattedDate(now);
  let message =
    trocProjectMember +
    `\nNgày ${today}\nCòn 30 phút nữa. Mọi người nhớ update trạng thái task đang làm, chuẩn bị trước QA (nếu có).\nAi có vấn đề gì thì báo ngay nhé`;

  if ([59, 0, 1].includes(now.getMinutes())) {
    message = trocProjectMember + `\nMọi người vào daily meeting nhé.`;
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
