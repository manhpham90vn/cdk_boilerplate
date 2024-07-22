import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs'

export class Main extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const s3_stack = new s3.Bucket(this, 'S3_Stack', {
            bucketName: process.env.S3_BUCKET
        })

        const vpc = new ec2.Vpc(this, "VPC_Stack", {
            ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
            maxAzs: 3,
            subnetConfiguration: [
                {
                    name: "public-subnet",
                    subnetType: ec2.SubnetType.PUBLIC,
                    cidrMask: 24
                },
                {
                    name: "private-subnet",
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                    cidrMask: 24
                }
            ]
        })

        new cdk.CfnOutput(this, "VPC_Id", {
            value: vpc.vpcId
        })
    }
}