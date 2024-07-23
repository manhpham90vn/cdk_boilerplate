import * as cdk from 'aws-cdk-lib';
import {RemovalPolicy} from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs'

export class Main extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create S3 bucket
        const bucketName = process.env.S3_BUCKET;
        if (!bucketName) {
            throw new Error('S3_BUCKET environment variable is not set');
        }
        new s3.Bucket(this, 'S3', {
            bucketName: bucketName,
            removalPolicy: RemovalPolicy.DESTROY
        })

        // Create VPC
        const vpc = new ec2.Vpc(this, "VPC", {
            ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
            enableDnsHostnames: false,
            enableDnsSupport: false,
            maxAzs: 3,
            natGateways: 0,
            subnetConfiguration: [],
        })

        // Create public subnets
        const publicSubnets: ec2.CfnSubnet[] = [];
        for (let i = 0; i < 3; i++) {
            const id = `PublicSubnet-${i + 1}`
            const cidrBlock = `10.0.${16 * i}.0/20`
            const availabilityZone = vpc.availabilityZones[i]
            console.log(availabilityZone)
            const publicSubnet = new ec2.CfnSubnet(this, id, {
                vpcId: vpc.vpcId,
                cidrBlock: cidrBlock,
                availabilityZone: availabilityZone,
                mapPublicIpOnLaunch: true,
            });
            publicSubnets.push(publicSubnet)
        }

        // Create private subnets
        for (let i = 0; i < 3; i++) {
            const id = `PrivateSubnet-${i + 1}`
            const cidrBlock = `10.0.${16 * i + 48}.0/20`
            const availabilityZone = vpc.availabilityZones[i]
            console.log(availabilityZone)
            new ec2.CfnSubnet(this, id, {
                vpcId: vpc.vpcId,
                cidrBlock: cidrBlock,
                availabilityZone: availabilityZone,
            });
        }

        // Create Internet Gateway
        const igw = new ec2.CfnInternetGateway(this, "InternetGateway", {})

        // Attach Internet Gateway to the VPC
        new ec2.CfnVPCGatewayAttachment(this, "VPCGatewayAttachment", {
            vpcId: vpc.vpcId,
            internetGatewayId: igw.ref
        })

        // Create route table for public subnets
        const publicRouteTable = new ec2.CfnRouteTable(this, "PublicRouteTable", {
            vpcId: vpc.vpcId
        })

        // Add default route to Internet Gateway in the public route table
        new ec2.CfnRoute(this, "DefaultRoute", {
            routeTableId: publicRouteTable.ref,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: igw.ref
        })

        // Associate public subnets with the public route table
        publicSubnets.forEach((subnet, index) => {
            new ec2.CfnSubnetRouteTableAssociation(this, `PublicSubnetAssociation-${index}`, {
                subnetId: subnet.ref,
                routeTableId: publicRouteTable.ref
            })
        })

        // Output VPC ID
        new cdk.CfnOutput(this, "VPC_Id", {
            value: vpc.vpcId
        })
    }
}