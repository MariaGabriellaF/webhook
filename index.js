const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// ✅ CORS e JSON
app.use(cors());
app.use(bodyParser.json());

// ✅ Credenciais da conta de serviço (Dialogflow ES)
const CREDENTIALS = require('./credentials.json');
const projectId = CREDENTIALS.project_id;

const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    private_key: CREDENTIALS.private_key,
    client_email: CREDENTIALS.client_email,
  },
});

app.post('/webhook', async (req, res) => {
  try {
    const message = String(req.body.message ?? '');
    const sessionId = uuid.v4();
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: 'pt-BR',
        },
      },
    };

    const [response] = await sessionClient.detectIntent(request);
    const result = response.queryResult;

    //Usa exatamente o que está configurado nas Intents (Responses) do Dialogflow
    const reply = (result.fulfillmentText && result.fulfillmentText.trim())
      ? result.fulfillmentText.trim()
      : 'Desculpa, não entendi. Pode tentar de outra forma?';


    return res.json({ reply });
  } catch (error) {
    console.error('Erro ao conectar com Dialogflow:', error);
    return res.status(500).send('Erro interno do servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
