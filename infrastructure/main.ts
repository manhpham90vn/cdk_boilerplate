import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import { proj, value } from "../validation/validate";

export class Main extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket
    new s3.Bucket(this, "S3", {
      bucketName: value.S3_BUCKET,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create VPC
    const vpc = new ec2.Vpc(this, "VPC", {
      vpcName: `${proj}-VPC`,
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      enableDnsHostnames: false,
      enableDnsSupport: false,
      maxAzs: 99,
      natGateways: 0,
      subnetConfiguration: [],
    });

    const availabilityZones = vpc.availabilityZones;

    // Create public subnets
    const publicSubnets: ec2.CfnSubnet[] = [];
    for (let i = 0; i < availabilityZones.length; i++) {
      const id = `PublicSubnet-${i + 1}`;
      const cidrBlock = `10.0.${16 * i}.0/20`;
      const availabilityZone = availabilityZones[i];
      const publicSubnet = new ec2.CfnSubnet(this, id, {
        vpcId: vpc.vpcId,
        cidrBlock: cidrBlock,
        availabilityZone: availabilityZone,
        mapPublicIpOnLaunch: true,
        tags: [{ key: "Name", value: `${proj}_${id}` }],
      });
      publicSubnets.push(publicSubnet);
    }

    // Create private subnets
    for (let i = 0; i < availabilityZones.length; i++) {
      const id = `PrivateSubnet-${i + 1}`;
      const cidrBlock = `10.0.${16 * i + 48}.0/20`;
      const availabilityZone = availabilityZones[i];
      new ec2.CfnSubnet(this, id, {
        vpcId: vpc.vpcId,
        cidrBlock: cidrBlock,
        availabilityZone: availabilityZone,
        tags: [{ key: "Name", value: `${proj}_${id}` }],
      });
    }

    // Create Internet Gateway
    const igw = new ec2.CfnInternetGateway(this, "InternetGateway", {
      tags: [{ key: "Name", value: `${proj}_InternetGateway` }],
    });

    // Attach Internet Gateway to the VPC
    new ec2.CfnVPCGatewayAttachment(this, "VPCGatewayAttachment", {
      vpcId: vpc.vpcId,
      internetGatewayId: igw.ref,
    });

    // Create route table for public subnets
    const publicRouteTable = new ec2.CfnRouteTable(this, "PublicRouteTable", {
      vpcId: vpc.vpcId,
      tags: [{ key: "Name", value: `${proj}_PublicRouteTable` }],
    });

    // Add default route to Internet Gateway in the public route table
    new ec2.CfnRoute(this, "DefaultRoute", {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.ref,
    });

    // Associate public subnets with the public route table
    publicSubnets.forEach((subnet, index) => {
      new ec2.CfnSubnetRouteTableAssociation(
        this,
        `PublicSubnetAssociation-${index}`,
        {
          subnetId: subnet.ref,
          routeTableId: publicRouteTable.ref,
        }
      );
    });

    const layer = new lambda.LayerVersion(this, "layer", {
      code: lambda.Code.fromAsset("lambda/layer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
    });

    const remindReportLambda = new lambda.Function(this, "remindReportLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: new lambda.AssetCode("lambda/remindReportLambda"),
      handler: "main.handler",
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      environment: {
        CHATWORK_TOKEN: value.CHATWORK_TOKEN,
        CHATWORK_DEV_TEAM_ROOM_ID: value.CHATWORK_DEV_TEAM_ROOM_ID,
        GOOGLE_SHEETS_DAILY_REPORT_ID: value.GOOGLE_SHEETS_DAILY_REPORT_ID,
      },
      layers: [layer],
    });

    const remindReportRule = new events.Rule(this, "remindReportRule", {
      schedule: events.Schedule.cron({
        minute: "30",
        hour: "9",
        weekDay: "MON-FRI",
        month: "*",
        year: "*",
      }),
    });

    remindReportRule.addTarget(new targets.LambdaFunction(remindReportLambda));

    const checkNotReportLambda = new lambda.Function(
      this,
      "checkNotReportLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: new lambda.AssetCode("lambda/checkNotReportLambda"),
        handler: "main.handler",
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        environment: {
          CHATWORK_TOKEN: value.CHATWORK_TOKEN,
          CHATWORK_DEV_TEAM_ROOM_ID: value.CHATWORK_DEV_TEAM_ROOM_ID,
          GOOGLE_SHEETS_DAILY_REPORT_ID: value.GOOGLE_SHEETS_DAILY_REPORT_ID,
          GOOGLE_SHEETS_DAILY_REPORT_RANGE:
            value.GOOGLE_SHEETS_DAILY_REPORT_RANGE,
        },
        layers: [layer],
      }
    );

    const checkNotReportRule1 = new events.Rule(this, "checkNotReportRule1", {
      schedule: events.Schedule.cron({
        minute: "00",
        hour: "10",
        weekDay: "MON-FRI",
        month: "*",
        year: "*",
      }),
    });

    const checkNotReportRule2 = new events.Rule(this, "checkNotReportRule2", {
      schedule: events.Schedule.cron({
        minute: "15",
        hour: "10",
        weekDay: "MON-FRI",
        month: "*",
        year: "*",
      }),
    });

    const checkNotReportRule3 = new events.Rule(this, "checkNotReportRule3", {
      schedule: events.Schedule.cron({
        minute: "30",
        hour: "10",
        weekDay: "MON-FRI",
        month: "*",
        year: "*",
      }),
    });

    checkNotReportRule1.addTarget(
      new targets.LambdaFunction(checkNotReportLambda)
    );
    checkNotReportRule2.addTarget(
      new targets.LambdaFunction(checkNotReportLambda)
    );
    checkNotReportRule3.addTarget(
      new targets.LambdaFunction(checkNotReportLambda)
    );

    const remindMTGLeader = new lambda.Function(this, "remindMTG", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: new lambda.AssetCode("lambda/remindMTG"),
      handler: "main.handler",
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      environment: {
        CHATWORK_TOKEN: value.CHATWORK_TOKEN,
        CHATWORK_LEADER_ROOM_ID: value.CHATWORK_LEADER_ROOM_ID,
      },
      layers: [layer],
    });

    const remindMTGLeaderRule = new events.Rule(this, "remindMTGLeaderRule", {
      schedule: events.Schedule.cron({
        minute: "00",
        hour: "01",
        weekDay: "MON-FRI",
        month: "*",
        year: "*",
      }),
    });

    remindMTGLeaderRule.addTarget(new targets.LambdaFunction(remindMTGLeader));

    // Output VPC ID
    new cdk.CfnOutput(this, "VPC_Id", {
      value: vpc.vpcId,
    });
  }
}
