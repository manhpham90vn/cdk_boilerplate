const axios = require('axios');

exports.handler = async (event) => {
    const apiToken = process.env.CHATWORK_TOKEN
    const roomId = '311928965';
    const message = "[toall]\n" + "Mọi người nhớ report nhé\n" + "https://docs.google.com/spreadsheets/d/14OVWPEHmoJD6atVf12hAoOSeILOGEvSFESAcRNrHURM/edit?gid=286191792#gid=286191792"

    try {
        const response = await axios.post(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, `body=${encodeURIComponent(message)}&self_unread=1`, {
            headers: {
                'x-chatworktoken': apiToken, 'Content-Type': 'application/x-www-form-urlencoded',
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