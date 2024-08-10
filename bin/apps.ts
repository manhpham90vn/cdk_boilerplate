#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { VPC } from "../infrastructure/vpc";
import { error, proj } from "../validation/validate";
import { Lambda } from "../infrastructure/lambda";

if (error) {
  throw error;
}

const app = new cdk.App();
new VPC(app, `${proj}-VPC`);
new Lambda(app, `${proj}-Lambda`);
