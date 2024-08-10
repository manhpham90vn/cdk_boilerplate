import { sendChatworkMessage } from "/opt/chatwork.mjs";
import { chatWorkMapLeaders } from "/opt/data.mjs";

export const handler = async (event) => {
  const message = `${chatWorkMapLeaders}\nLịch họp ${event.eventName} vào lúc ${event.eventStartTime} ngày ${event.eventStartDate}. Link: ${event.eventLink}\nHãy tiến hành report đầy đủ`;
  const response = await sendChatworkMessage(
    message,
    process.env.CHATWORK_LEADER_ROOM_ID,
    process.env.CHATWORK_TOKEN
  );
  console.log(response);
};
