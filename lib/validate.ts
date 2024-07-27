import * as Joi from "joi";
import 'dotenv/config'

const envSchema = Joi.object().keys({
    PROJECT_NAME: Joi.string().required(),
    ENV: Joi.string().valid("dev", "prod", "stg").required(),
    S3_BUCKET: Joi.string().required()
})

const env = {
    PROJECT_NAME: process.env.PROJECT_NAME,
    ENV: process.env.ENV,
    S3_BUCKET: process.env.S3_BUCKET
}

const {value, error} = Joi.compile(envSchema).validate(env)

const proj = `${value.PROJECT_NAME}-${value.ENV}`

export {value, error, proj}