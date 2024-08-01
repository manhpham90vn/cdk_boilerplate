import * as Joi from "joi";
import 'dotenv/config'

const envSchema = Joi.object().keys({
    PROJECT_NAME: Joi.string().required(),
    ENV: Joi.string().valid("dev", "prod", "stg").required(),
    S3_BUCKET: Joi.string().required(),
    CHATWORK_TOKEN: Joi.string().required(),
    CHATWORK_ROOM_ID: Joi.string().required(),
    GOOGLE_SHEETS_ID: Joi.string().required(),
    GOOGLE_SHEETS_RANGE: Joi.string().required()
})

const env = {
    PROJECT_NAME: process.env.PROJECT_NAME,
    ENV: process.env.ENV,
    S3_BUCKET: process.env.S3_BUCKET,
    CHATWORK_TOKEN: process.env.CHATWORK_TOKEN,
    CHATWORK_ROOM_ID: process.env.CHATWORK_ROOM_ID,
    GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
    GOOGLE_SHEETS_RANGE: process.env.GOOGLE_SHEETS_RANGE
}

const {value, error} = Joi.compile(envSchema).validate(env)

const proj = `${value.PROJECT_NAME}-${value.ENV}`

export {value, error, proj}