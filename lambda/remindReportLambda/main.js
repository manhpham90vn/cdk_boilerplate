const axios = require('axios');

const sendChatworkMessage = async (message) => {
    try {
        const response = await axios.post(`https://api.chatwork.com/v2/rooms/${process.env.CHATWORK_ROOM_ID}/messages`, `body=${encodeURIComponent(message)}&self_unread=1`, {
            headers: {
                'x-chatworktoken': process.env.CHATWORK_TOKEN, 'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return {
            success: true,
            message: "Message sent successfully!",
            error: null
        }
    } catch (error) {
        return {
            success: false,
            message: "Failed to send message!",
            error: error.message
        }
    }
}

exports.handler = async (event) => {
    const message = `[toall]\nMọi người nhớ report nhé\nhttps://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_ID}/edit?gid=286191792#gid=286191792`
    const response = await sendChatworkMessage(message);
    console.log(response)
}