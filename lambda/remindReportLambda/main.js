const axios = require('axios');

exports.handler = async (event) => {
    const message = `[toall]\nMọi người nhớ report nhé\nhttps://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_ID}/edit?gid=286191792#gid=286191792`

    try {
        const response = await axios.post(`https://api.chatwork.com/v2/rooms/${process.env.CHATWORK_ROOM_ID}/messages`, `body=${encodeURIComponent(message)}&self_unread=1`, {
            headers: {
                'x-chatworktoken': process.env.CHATWORK_TOKEN, 'Content-Type': 'application/x-www-form-urlencoded',
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