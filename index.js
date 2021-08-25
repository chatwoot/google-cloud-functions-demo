// Configure the API ACCESS TOKEN && APP HOST && ACCOUNT ID
// Change code with relevant team IDs and logic

const functions = require('firebase-functions');
const axios = require('axios')
const Chatwoot = require('@chatwoot/node');
const isDev = process.env.NODE_ENV !== 'production'
// Replace with your API_ACCESS_TOKEN
const API_ACCESS_TOKEN = '';
// Replace with your chatwoot host URL
const APP_HOST = isDev ? 'http://localhost:3000' : 'https://app.chatwoot.com';
// Replace with your account id
const ACCOUNT_ID = 1;
const ChatwootClient = new Chatwoot({ config: { host: APP_HOST, apiAccessToken: API_ACCESS_TOKEN } })
const Conversations = ChatwootClient.conversations(ACCOUNT_ID)

const teamIDs = {
  sales: 1223,
  engineering: isDev ? 13432 : 22023,
  product: isDev ? 13523 : 32221
}

const getTeamToBeAssignedTo = (messageContent) => {
  if (messageContent.includes('pricing') || messageContent.includes('price') || messageContent.includes('enterprise') || messageContent.includes('sales')) {
    return {
      teamId: teamIDs.sales,
      label: ['billing-inquiry'],
    }
  }

  if (messageContent.includes('error') || messageContent.includes('selfhosted') || messageContent.includes('translation') || messageContent.includes('self')) {
    return {
      teamId: teamIDs.engineering,
      label: ['support-query']
    }
  }

  if (messageContent.includes('page') || messageContent.includes('page views')) {
    return {
      teamId: teamIDs.product,
      label: ['product-feedback']
    }
  }
}

const setConversationTeamAndLabel = async (conversationId, messageContent) => {
  try {
    const { data: { meta = {} } = {} } = await Conversations.show(conversationId)
    if (!meta.team) {
      const {teamId, label} = getTeamToBeAssignedTo(messageContent);
      if (teamId) {
        Conversations.assignTeam(conversationId, teamId)
        Conversations.updateLabels(conversationId, label)
      }
    }
  } catch(error) {
    console.log(error);
  }
}

exports.parseChatwootWebhook = functions.https.onRequest((request, response) => {
  const { event } = request.body

  if (event !== 'message_created') {
    return response.send('Success')
  }

  const { conversation: { id: conversationId }, message_type: messageType, content } = request.body
  if (messageType !== 'incoming') {
    return response.send('Success')
  }
  setConversationTeamAndLabel(conversationId, content || '')

  response.send("Success");
});
