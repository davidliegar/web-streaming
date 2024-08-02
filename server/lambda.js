import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
let apigwManagementApi = undefined;

async function handleConnect (connectionId) {
  const put = new PutCommand({
    TableName: 'Chat',        
    Item: {
      connectionid : connectionId
    }
  });
  
  await docClient.send(put);
}

async function handleDisconnect (connectionId) {
  const deleteCommand = new DeleteCommand({
    TableName: 'Chat',        
    Key: {
      connectionid : connectionId
    }
  });
  
  await docClient.send(deleteCommand);
}

async function handleMessage (message) {
  const query = new ScanCommand({
    TableName: 'Chat'
  });
  
  const result = await docClient.send(query);
  
  result.Items.forEach(async item => {
    await sendMessage(message, item.connectionid);
  });
}

async function sendMessage (message, connectionId) {
  const input = {
    Data: JSON.stringify(message),
    ConnectionId: connectionId,
  };
  
  const command = new PostToConnectionCommand(input);
  
  console.log('apigwManagementApi', apigwManagementApi);
  
  await apigwManagementApi.send(command);
}

export const handler = async (event, context, callback) => {
  const routeKey = event.requestContext.routeKey;
  const endpoint = 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage;

  apigwManagementApi = new ApiGatewayManagementApiClient({
    endpoint: endpoint
  });

  if (routeKey === "$connect") {
    await handleConnect(event.requestContext.connectionId);
  }
  
  if (routeKey === '$disconnect') {
    await handleDisconnect(event.requestContext.connectionId);
  }
  
  if (routeKey === '$default') {
    await handleMessage(event.body);
  }
  
  callback(null, {
    statusCode: 200
  });
};
