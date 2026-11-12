// src/index.js (ou index.js na raiz)
const express = require('express');
const cors = require('cors');
const dialogflow = require('@google-cloud/dialogflow'); // Dialogflow ES
const uuid = require('uuid');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // substitui body-parser

// Porta (Render define process.env.PORT)
const PORT = process.env.PORT || 3000;

// Health checks (evita deploy failed no Render)
app.get('/', (_, res) => res.status(200).send('ok'));
app.get('/webhook', (_, res) => res.status(200).send('ok'));

// Credenciais do Dialogflow ES
const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const projectId = CREDENTIALS.project_id;

const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    private_key: CREDENTIALS.private_key,
    client_email: CREDENTIALS.client_email,
  },
});

// Endpoint principal
app.post('/webhook', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message : '';
    if (!message.trim()) {
      return res.status(400).send('Mensagem não fornecida');
    }

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

    const reply = (result?.fulfillmentText && result.fulfillmentText.trim())
      ? result.fulfillmentText.trim()
      : 'Desculpa, não entendi. Pode tentar de outra forma?';

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Erro ao conectar com Dialogflow:', error);
    return res.status(500).send('Erro interno do servidor');
  }
});

// Inicia servidor (Render usa PORT dinâmica)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
