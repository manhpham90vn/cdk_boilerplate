import axios from "axios";

export const sendChatworkMessage = async (message, room, token) => {
  const url = `https://api.chatwork.com/v2/rooms/${room}/messages`;
  const data = `body=${encodeURIComponent(message)}&self_unread=1`;
  const headers = {
    "x-chatworktoken": token,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    const response = await axios.post(url, data, {
      headers: headers,
    });
    return {
      success: true,
      message: "Message sent successfully!",
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to send message!",
      error: error.message,
    };
  }
};
