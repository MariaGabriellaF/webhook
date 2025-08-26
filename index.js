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

// Carrega as credenciais da conta de serviço
const CREDENTIALS = require('./credentials.json');

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
    const intent = result.intent.displayName;

    let reply = '';

    switch (intent) {
      case 'saudacao_menu':
        reply = `Olá! Eu sou um chatbot que vai te contar mais sobre o *Sapajus flavius*, também conhecido como *macaco-prego-galego*. O que você gostaria de saber?\n\nEscolha uma opção:\n1️⃣ Explicando sobre o macaco-prego-galego\n2️⃣ Onde eles vivem?\n3️⃣ O que eles comem?\n4️⃣ Como preservar essa espécie?\n5️⃣ Quem são seus predadores?`;
        break;

      case 'opcao_1':
        reply = '🟢 O macaco-prego-galego (Sapajus flavius) é uma espécie endêmica da Mata Atlântica nordestina, famosa por sua inteligência e uso de ferramentas. Está ameaçado de extinção.';
        break;

      case 'opcao_2':
        reply = '🌳 Eles vivem em fragmentos de Mata Atlântica no nordeste do Brasil — como na Paraíba, Pernambuco e Alagoas.';
        break;

      case 'opcao_3':
        reply = '🍌 A alimentação deles inclui frutas, sementes, insetos, pequenos animais e ovos. São onívoros e muito adaptáveis.';
        break;

      case 'opcao_4':
        reply = '🌱 Para preservar a espécie, é necessário proteger seu habitat, combater o desmatamento e promover educação ambiental.';
        break;

      case 'opcao_5':
        reply = '🦅 Os predadores naturais incluem aves de rapina e serpentes, mas os maiores perigos hoje são a caça e o desmatamento causados por humanos.';
        break;

      default:
        reply = result.fulfillmentText || 'Desculpa, não entendi. Por favor, escolha uma opção de 1 a 5.';
    }

    res.json({ reply });
  } catch (error) {
    console.error('Erro ao conectar com Dialogflow:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
