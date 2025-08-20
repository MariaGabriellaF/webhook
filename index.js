const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// ✅ Ativa o CORS para permitir requisições do frontend
app.use(cors());

// Middleware para aceitar JSON
app.use(bodyParser.json());

// Carrega as credenciais da conta de serviço (suba o arquivo JSON no mesmo diretório no Render)
const CREDENTIALS = require('./credentials.json'); // Altere para o nome do seu JSON

const projectId = CREDENTIALS.project_id;
const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    private_key: CREDENTIALS.private_key,
    client_email: CREDENTIALS.client_email,
  },
});

// Rota para receber mensagens do frontend
app.post('/webhook', async (req, res) => {
  const message = req.body.message;
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

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    res.json({ reply: result.fulfillmentText });
  } catch (error) {
    console.error('Erro ao conectar com Dialogflow:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
