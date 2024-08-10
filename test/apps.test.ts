import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { Main } from "../infrastructure/vpc";
import { proj, value } from "../validation/validate";

let app: cdk.App, stack: cdk.Stack, template: Template;

beforeAll(() => {
  app = new cdk.App();
  stack = new Main(app, proj);
  template = Template.fromStack(stack);
});

describe("S3 bucket", () => {
  it("Should have a S3 bucket with the name ‘S3_BUCKET’ present", () => {
    template.hasResourceProperties(
      "AWS::S3::Bucket",
      Match.objectLike({
        BucketName: value.S3_BUCKET,
      })
    );
  });
});

describe("VPC", () => {
  it("VPC Name", () => {
    template.hasResourceProperties(
      "AWS::EC2::VPC",
      Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: "Name", Value: `${proj}-VPC` }),
        ]),
      })
    );
  });
});
