import * as cdk from 'aws-cdk-lib';
import {Match, Template} from 'aws-cdk-lib/assertions';
import {Main} from '../lib/main';
import 'dotenv/config'

let app: cdk.App, stack: cdk.Stack, template: Template;

beforeAll(() => {
    app = new cdk.App();
    const stack = new Main(app, process.env.ENV ?? "dev")
    template = Template.fromStack(stack);
});

describe('S3 bucket', () => {
    it('Should have a S3 bucket with the name ‘S3_BUCKET’ present', () => {
        template.hasResourceProperties('AWS::S3::Bucket',
            Match.objectLike({
                BucketName: process.env.S3_BUCKET
            })
        );
    });
});