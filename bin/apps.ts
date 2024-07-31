#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {Main} from "../infrastructure/main";
import {error, proj} from "../validation/validate"

if (error) {
    throw error
}

const app = new cdk.App();
new Main(app, proj)

