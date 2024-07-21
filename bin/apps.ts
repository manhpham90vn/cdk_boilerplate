#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {Main} from "../lib/main";
import 'dotenv/config'

const app = new cdk.App();
new Main(app, process.env.ENV ?? "dev");