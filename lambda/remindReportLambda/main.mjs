import {sendChatworkMessage} from '/opt/chatwork.mjs';

export const handler = async (event) => {
    const message = `[toall]\nMọi người nhớ report nhé\nhttps://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_ID}/edit?gid=286191792#gid=286191792`
    const response = await sendChatworkMessage(message);
    console.log(response)
}