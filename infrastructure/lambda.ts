import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { value } from "../validation/validate";

export class Lambda extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const layer = new lambda.LayerVersion(this, "layer", {
      code: lambda.Code.fromAsset("lambda/layerLambda"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
    });

    const remindChatworkDailyReportLambda = new lambda.Function(
      this,
      "remindChatworkDailyReportLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: new lambda.AssetCode("lambda/remindChatworkDailyReportLambda"),
        handler: "main.handler",
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        memorySize: 512,
        environment: {
          CHATWORK_TOKEN: value.CHATWORK_TOKEN,
          CHATWORK_DEV_TEAM_ROOM_ID: value.CHATWORK_DEV_TEAM_ROOM_ID,
          GOOGLE_SHEETS_DAILY_REPORT_ID: value.GOOGLE_SHEETS_DAILY_REPORT_ID,
        },
        layers: [layer],
      }
    );

    const remindReportRule = new events.Rule(this, "remindReportRule", {
      schedule: events.Schedule.cron({
        minute: "30",
        hour: "9",
        weekDay: "MON-FRI",
        month: "*",
        year: "*",
      }),
    });

    remindReportRule.addTarget(
      new targets.LambdaFunction(remindChatworkDailyReportLambda)
    );

    const checkNotDailyReportLambda = new lambda.Function(
      this,
      "checkNotDailyReportLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: new lambda.AssetCode("lambda/checkNotDailyReportLambda"),
        handler: "main.handler",
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        memorySize: 512,
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
      new targets.LambdaFunction(checkNotDailyReportLambda)
    );
    checkNotReportRule2.addTarget(
      new targets.LambdaFunction(checkNotDailyReportLambda)
    );
    checkNotReportRule3.addTarget(
      new targets.LambdaFunction(checkNotDailyReportLambda)
    );

    new lambda.Function(this, "remindChatworkMTGLeaderLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: new lambda.AssetCode("lambda/remindChatworkMTGLeaderLambda"),
      handler: "main.handler",
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
      environment: {
        CHATWORK_TOKEN: value.CHATWORK_TOKEN,
        CHATWORK_LEADER_ROOM_ID: value.CHATWORK_LEADER_ROOM_ID,
        AWS_LAMBDA_FUNCTION_ARN: value.AWS_LAMBDA_FUNCTION_ARN,
      },
      layers: [layer],
    });

    const createRuleMTGLeaderLambda = new lambda.Function(
      this,
      "createRuleMTGLeaderLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: new lambda.AssetCode("lambda/createRuleMTGLeaderLambda"),
        handler: "main.handler",
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        memorySize: 512,
        environment: {
          LAMBDA_FUNCTION_ARN: value.LAMBDA_FUNCTION_ARN,
          LAMBDA_FUNCTION_NAME: value.LAMBDA_FUNCTION_NAME,
        },
        layers: [layer],
      }
    );

    createRuleMTGLeaderLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "events:PutRule",
          "events:PutTargets",
          "events:DescribeRule",
          "events:RemoveTargets",
          "events:DeleteRule",
          "lambda:AddPermission",
          "lambda:RemovePermission",
        ],
        resources: ["*"],
      })
    );

    const createRuleMTGLeaderLambdaRule = new events.Rule(
      this,
      "createRuleMTGLeaderLambdaRule",
      {
        schedule: events.Schedule.cron({
          minute: "00",
          hour: "01",
          weekDay: "MON-FRI",
          month: "*",
          year: "*",
        }),
      }
    );

    createRuleMTGLeaderLambdaRule.addTarget(
      new targets.LambdaFunction(createRuleMTGLeaderLambda)
    );

    const remindChatworkDailyMeetingTrocLambda = new lambda.Function(
      this,
      "remindChatworkDailyMeetingTrocLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: new lambda.AssetCode(
          "lambda/remindChatworkDailyMeetingTrocLambda"
        ),
        handler: "main.handler",
        architecture: lambda.Architecture.ARM_64,
        timeout: cdk.Duration.seconds(10),
        memorySize: 512,
        environment: {
          CHATWORK_TOKEN: value.CHATWORK_TOKEN,
          CHATWORK_TROC_ROOM_ID: value.CHATWORK_TROC_ROOM_ID,
        },
        layers: [layer],
      }
    );

    const remindChatworkDailyMeetingTrocRule1 = new events.Rule(
      this,
      "remindChatworkDailyMeetingTrocRule1",
      {
        schedule: events.Schedule.cron({
          minute: "30",
          hour: "9",
          weekDay: "MON-FRI",
          month: "*",
          year: "*",
        }),
      }
    );
    remindChatworkDailyMeetingTrocRule1.addTarget(
      new targets.LambdaFunction(remindChatworkDailyMeetingTrocLambda)
    );

    const remindChatworkDailyMeetingTrocRule2 = new events.Rule(
      this,
      "remindChatworkDailyMeetingTrocRule2",
      {
        schedule: events.Schedule.cron({
          minute: "00",
          hour: "10",
          weekDay: "MON-FRI",
          month: "*",
          year: "*",
        }),
      }
    );
    remindChatworkDailyMeetingTrocRule2.addTarget(
      new targets.LambdaFunction(remindChatworkDailyMeetingTrocLambda)
    );
  }
}
