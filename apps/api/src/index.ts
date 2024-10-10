/* eslint-disable unicorn/prefer-top-level-await */
import express from 'express';
import { type Request, type Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import passport from 'passport';
import TelegramBot from 'node-telegram-bot-api';
import bodyParser from 'body-parser';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import {
  ChatAgent,
  ChatAgentError,
  ChatCompletionTextResponse,
  CryptoPriceTool,
  GoogleSearchTool,
  GoogleSpeechToText,
  GoogleTextToSpeech,
  ImageDescribeTool,
  Memory,
  OpenAIChatCompletion,
  TextModelResponse,
  TextToSpeechVoice,
  Tool,
  TranscriptionError,
  UserSessionManager,
  WeatherTool,
} from './lib';
import { logger } from './lib/logger';
import { ClientToServerEvents, ServerToClientEvents } from './interface/socket-server';
import { TokenSwapTool } from './lib/tools/swap-token';

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      chatAgent: ChatAgent;
    }
  }
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN as string;
const MAX_CONVERSATION_TURNS = 5;
const MAX_CACHED_USER_HISTORIES = 100;
const jwtSecret = process.env.JWT_SECRET as string;

const jwtDecodeOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
  issuer: 'auth.showtime.com',
  audience: 'localhost:3000',
};

const openai = new OpenAIChatCompletion({
  model: 'gpt-4o-mini',
  temperature: 1,
});
const textToSpeechModel = new GoogleTextToSpeech();
const speechToTextModel = new GoogleSpeechToText();

// Create telegram bot instance
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
  },
} as TelegramBot.ConstructorOptions);

const userSessionManager = new UserSessionManager(
  MAX_CACHED_USER_HISTORIES,
  MAX_CONVERSATION_TURNS
);

interface GetChatAgentParams {
  userId: string;
  firstName?: string;
  lastName?: string;
  tools?: Tool[];
  useSpeech?: boolean;
}

const getChatAgent = async ({
  userId,
  firstName,
  lastName,
  tools = [],
  useSpeech = false,
}: GetChatAgentParams): Promise<ChatAgent> => {
  const memory = new Memory();
  const now = new Date().toISOString();
  const useSpeechText = useSpeech
    ? '\nYou communicate through speech-to-text and respond using text-to-speech. You are not able to use emojis or formatted text like point form, Markdown or HTML in your responses.\n'
    : '';
  const userProfileText = `\nYou are talking with a user their first name is ${firstName} and last name is ${lastName}, remember, this is not necessarily the same as the user's real name.\n`;
  const currentTimeText = `\nThe current time is ${now}\n`;
  const chatAgent = new ChatAgent({
    systemInstruction: `You are the spirit of Samantha, a helpful personal assistant build by Hetaro Labs, a company that specializes in AI and blockchain technologies. Showtime watch is one of our project, it is a AI + Blockchain smartwatch, it priced at 3 SOL(Solana) during pre-sale period and the product website is https://show.watch/${useSpeechText}${userProfileText}${currentTimeText}`,
    memory,
    chatCompletionModel: openai,
    tools,
  });

  // get the updated user history
  const userHistory = userSessionManager.get(userId);

  logger.debug('userHistory', { userHistory });

  // set the user history to memory
  memory.setHistory(userHistory.history);
  // memory.setHistory([]);

  memory.on('addMessage', async ({ conversation }) => {
    logger.debug('addMessage -> conversation', { conversation });

    userSessionManager.addMessage(userId, conversation);
  });

  return chatAgent;
};

const textToSpeechTextPreprocess = (text: string): string => {
  let returnText = text.replace(/\*+/, '').trim();

  returnText = returnText.replace(/_/g, ' ');
  returnText = returnText.replace(/\n/g, ' ');
  returnText = returnText.replace(/\s+/g, ' ');
  returnText = returnText.replace(/<[^>]*>/g, '');
  returnText = returnText.replace(/&nbsp;/g, ' ');
  returnText = returnText.replace(/#+/g, ' ');

  return returnText;
};

export interface InterServerEvents {
  ping: () => void;
}

const port = process.env.PORT || 3000;
const app = express();
const http = new HTTPServer(app);
const io = new SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents>(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json());

passport.use(
  new JwtStrategy(jwtDecodeOptions, async (payload, done) => {
    logger.debug('JwtStrategy -> payload', { payload });

    const { firstName, lastName, id: userId } = payload;
    const chatAgent = await getChatAgent({
      userId,
      firstName,
      lastName,
      tools: [
        new WeatherTool(),
        new GoogleSearchTool(),
        new ImageDescribeTool(userSessionManager),
        new CryptoPriceTool(),
        new TokenSwapTool(),
      ],
      useSpeech: true,
    });

    return done(null, { ...payload, chatAgent });
  })
);

// default telegram bot events
bot.on('message', async message => {
  logger.debug('telegram bot incoming message', { message });

  const { id: chatId, first_name: firstName, last_name: lastName } = message.chat;
  const userId = chatId.toString();

  if (message.text === '/clear_context') {
    userSessionManager.delete(userId);

    bot.sendMessage(chatId, 'Context cleared.');

    return;
  }

  let userMessage = message.text as string;
  const chatAgent = await getChatAgent({
    userId,
    firstName,
    lastName,
    tools: [
      new WeatherTool(),
      new GoogleSearchTool(),
      new ImageDescribeTool(userSessionManager),
      new CryptoPriceTool(),
      // new TokenSwapTool(), // no token swap tool for telegram
    ],
  });

  // handle photo message
  if (message.photo) {
    const photoLink = await bot.getFileLink(message.photo[2].file_id);
    const query = message.caption || 'Describe this image.';

    logger.debug('telegram bot incoming message -> photoLink', photoLink);

    const documentId = userSessionManager.addDocument(userId, {
      mimeType: 'image/jpeg',
      url: photoLink,
      metadata: {
        caption: query,
      },
    });

    userMessage = `[image#${documentId}]\n ${query}`;
  }

  // handle voice message
  if (message.voice) {
    const voiceLink = await bot.getFileLink(message.voice.file_id);
    const voiceFileResponse = await axios.get(voiceLink, { responseType: 'arraybuffer' });
    const voiceBuffer = Buffer.from(voiceFileResponse.data);

    logger.debug('telegram bot incoming message -> voiceLink', voiceLink);

    const transcription = await speechToTextModel.recognize(voiceBuffer);

    if (!transcription.content) {
      bot.sendMessage(
        chatId,
        'Sorry, I could not understand your voice message. Please try again.'
      );

      return;
    }

    userMessage = transcription.content;
  }

  try {
    const response = await chatAgent.chat(userMessage);
    let responseText = (response as TextModelResponse<ChatCompletionTextResponse>).response.text;

    // escape text _*[]()~`>#+-=|{}.! with \
    responseText = responseText.replace(/([!#()*+.=>[\]_`{|}~-])/g, '\\$1');

    // message text 4096 character limit, so split into multiple messages
    const messageLimit = 4096;

    if (responseText.length >= messageLimit) {
      const responseTextArray = responseText.match(new RegExp(`.{1,${messageLimit}}`, 'g'));

      if (responseTextArray) {
        // eslint-disable-next-line unicorn/no-array-for-each
        responseTextArray.forEach(async text => {
          // send a message to the chat acknowledging receipt of their message
          bot.sendMessage(chatId, text, {
            parse_mode: 'MarkdownV2',
          });
        });
      }
    } else {
      // send a message to the chat acknowledging receipt of their message
      bot.sendMessage(chatId, responseText, {
        parse_mode: 'MarkdownV2',
      });
    }
  } catch (error) {
    logger.error('telegram bot incoming message -> error', { error });

    bot.sendMessage(chatId, 'Sorry, I could not process your message. Please try again.');
  }
});

// default socket.io events
io.on('ping', () => {
  logger.debug('ping');
});

io.engine.use((req: { _query: Record<string, string> }, res: Response, next: () => void) => {
  const isHandshake = req._query.sid === undefined;

  if (isHandshake) {
    passport.authenticate('jwt', { session: false })(req, res, next);
  } else {
    next();
  }
});

io.engine.on('connection_error', error => {
  logger.debug('connection_error', { error });
});

io.on('connection', async socket => {
  socket.on('chat', async (inputText, callback) => {
    const req = socket.request as Request & { user: Express.User & { chatAgent: ChatAgent } };
    const userId = req.user.id;

    req.user.chatAgent.addListener('toolExecuted', (toolName, args, executedReturn) => {
      logger.debug('toolExecuted', { toolName, args, executedReturn });

      socket.emit('toolExecuted', toolName, args, executedReturn);
    });

    logger.debug('connection -> userId', { userId });

    socket.join(`user:${userId}`);

    logger.debug('chat -> input', { inputText });

    const response = await req.user.chatAgent.chat(inputText);

    logger.debug('chat -> response', { response });

    try {
      const responseText = textToSpeechTextPreprocess(
        (response as TextModelResponse<ChatCompletionTextResponse>).response.text
      );
      const responseSpeech = await textToSpeechModel.synthesizeSpeech(
        responseText,
        TextToSpeechVoice.FEMALE1
      );

      callback({
        responseSpeech,
        responseText,
        inputText,
      });
    } catch (error) {
      logger.error('chat -> error', { error });

      callback({
        inputText,
        error: new ChatAgentError('Error processing response', 'RESPONSE ERROR'),
      });
    }
  });

  socket.on('asr', async (buffer, callback) => {
    logger.debug('asr -> input', { buffer });

    try {
      const response = await speechToTextModel.recognize(Buffer.from(buffer));

      callback(response);
    } catch (error) {
      logger.error('asr -> error', { error });

      callback({
        error: new TranscriptionError(),
      });
    }
  });
});

app.get('/self', passport.authenticate('jwt', { session: false }), (req, res) => {
  if (req.user) {
    res.send(req.user);
  } else {
    res.status(401).end();
  }
});

app.post('/chat', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { input: inputText } = req.body;

  logger.debug('chat -> input', { inputText });

  if (!req.user) {
    throw new Error('User not found');
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const response = await req.user!.chatAgent.chat(inputText);

  logger.debug('chat -> response', { response });

  const responseText = textToSpeechTextPreprocess(
    (response as TextModelResponse<ChatCompletionTextResponse>).response.text
  );

  res.json({
    input: inputText,
    response: responseText,
  });
});

// await fetch('http://localhost:3000/login', { method: 'POST', headers: {  'Content-Type': 'application/json', }, body: JSON.stringify({  username: 'john', password: '123456' }) });
app.post('/login', (req, res) => {
  if (req.body.username === 'john' && req.body.password === '123456') {
    res.json({
      token: jwt.sign({ data: { id: 1, username: 'john' } }, jwtSecret, {
        expiresIn: '24h',
        issuer: 'auth.showtime.com',
        audience: 'localhost:3000',
      }),
    });

    return;
  }

  res.status(401).end();
});

app.post('/login', (req, res) => {
  if (req.body.username === 'john' && req.body.password === '123456') {
    logger.debug('/login -> authentication OK');

    // For testing only
    const user = {
      id: 1,
      username: 'john',
    };

    const token = jwt.sign(
      {
        data: user,
      },
      jwtSecret,
      {
        issuer: 'auth.showtime.com',
        audience: 'localhost:3000',
        expiresIn: '24h',
      }
    );

    res.json({ token });
  } else {
    logger.error('wrong credentials');
    res.status(401).end();
  }
});

logger.info('connecting to redis...');

// Connect to the Redis instance
userSessionManager
  .connect()
  // eslint-disable-next-line promise/always-return
  .then(() => {
    // Start the server
    http.listen(port, () => {
      // eslint-disable-next-line no-console
      logger.info(`listening on port ${port}`);
    });
  })
  .catch(error => {
    logger.error('error', { error });
  });
