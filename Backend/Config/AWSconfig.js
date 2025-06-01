import dynamoose from 'dynamoose';
import dotenv from "dotenv";
dotenv.config();

export const awsConfig = {
    initialize: () => {
const ddb = new dynamoose.aws.ddb.DynamoDB({
	"credentials": {
		"accessKeyId": process.env.AWS_ACCESS_KEY_ID ,
		"secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY
	},
	"region":  process.env.AWS_REGION || 'us-east-1'
});

console.log("AWS INITIALIZED");
// Set DynamoDB instance to the Dynamoose DDB instance
dynamoose.aws.ddb.set(ddb);
    }
}

