#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {Main} from "../lib/main";
import {error, proj} from "../lib/validate"

if (error) {
    throw error
}

const app = new cdk.App();
new Main(app, proj)

