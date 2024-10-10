import { EventEmitter } from 'events';
import { Tool } from '../tools';
import { Memory } from '../memory';
import {
  ChatCompletion,
  ChatCompletionFunctionCallResponse,
  ChatCompletionResponse,
  ChatCompletionResponseType,
  ChatMessage,
  ChatMessageRole,
  Conversation,
  FunctionCallResponseChatMessage,
  TextModelFinishReason,
  TextModelResponse,
  UserChatMessage,
  convertResponseToChatMessage,
} from '../text-models';
import { TextToSpeech, TextToSpeechVoice } from '../speech/text-to-speech';
import { SpeechToText } from '../speech/speech-to-text';
import { logger } from '../logger';

export class ChatAgentError extends Error {
  constructor(
    public readonly message = 'ChatAgentError',
    public readonly code = 'ERROR'
  ) {
    super(message);
  }
}
export class ChatAgentGenerateError extends ChatAgentError {
  constructor() {
    super('Failed to generate content', 'GENERATE_ERROR');
  }
}

export class ChatAgentFunctionCallError extends ChatAgentError {
  constructor() {
    super('Failed to call function', 'FUNCTION_CALL_ERROR');
  }
}

export class ChatAgentFunctionCallNotFoundError extends ChatAgentError {
  constructor() {
    super('Function not found', 'FUNCTION_CALL_NOT_FOUND_ERROR');
  }
}

interface ChatEvent {
  message: string;
  memory: Conversation[];
  tools: Tool[];
}

interface TalkEvent {
  message: Buffer;
  memory: Conversation[];
  tools: Tool[];
}

interface ResponseEvent {
  response: TextModelResponse<ChatCompletionResponse>[];
  memory: Conversation[];
  tools: Tool[];
}

interface SpeechResponseEvent {
  response: Buffer;
  memory: Conversation[];
  tools: Tool[];
}

export interface ChatSpeechSuccessResponse {
  responseSpeech: ArrayBuffer;
  responseText: string;
  inputText: string;
  error?: never;
}

export interface ChatSpeechErrorResponse {
  responseSpeech?: never;
  responseText?: never;
  inputText: string;
  error: ChatAgentError;
}

export type ChatSpeechResponse = ChatSpeechSuccessResponse | ChatSpeechErrorResponse;

interface ChatAgentEvents {
  addTool: (tool: Tool) => void;
  chat: (payload: ChatEvent) => void;
  chatResponse: (payload: ResponseEvent) => void;
  chatSpeechResponse: (payload: SpeechResponseEvent) => void;
  talk: (payload: TalkEvent) => void;
  toolExecuted: (toolName: string, args: object, executedReturn: object) => void;
}

export declare interface ChatAgent {
  on<U extends keyof ChatAgentEvents>(event: U, listener: ChatAgentEvents[U]): this;
  emit<U extends keyof ChatAgentEvents>(event: U, ...args: Parameters<ChatAgentEvents[U]>): boolean;
}

export interface ChatAgentParams {
  systemInstruction: string;
  chatCompletionModel: ChatCompletion;
  ttsModel?: TextToSpeech;
  sttModel?: SpeechToText;
  tools?: Tool[];
  memory?: Memory;
  voiceName?: TextToSpeechVoice;
}

export class ChatAgent extends EventEmitter {
  public tools: Tool[] = [];

  public systemInstruction: string;

  public chatCompletionModel: ChatCompletion;

  public memory: Memory;

  public onToolExecuted?: (toolName: string, args: object, executedReturn: object) => void;

  constructor({ systemInstruction, chatCompletionModel, tools, memory }: ChatAgentParams) {
    super();

    this.tools = tools || [];
    this.chatCompletionModel = chatCompletionModel;
    this.systemInstruction = systemInstruction;
    this.memory = memory || new Memory();
    this.chatCompletionModel.setSystemInstruction(systemInstruction);
  }

  public async addTool(tool: Tool) {
    logger.debug('ChatAgent: Adding tool:', { tool });

    this.emit('addTool', tool);

    this.tools.push(tool);
  }

  public preprocessMessages(messages: ChatMessage[]): ChatMessage[] {
    // remove incomplete function call
    return messages.filter((message, index, array) => {
      const nextMessage = index + 1 < array.length ? array[index + 1] : null;

      if (message.functionCall && nextMessage && !nextMessage.functionCallResponse) {
        return false;
      }

      return true;
    });

    return messages;
  }

  // TODO: refactor to use message part object, instead of text / image as arguments
  public async chat(
    input: string,
    image?: string
  ): Promise<TextModelResponse<ChatCompletionResponse>> {
    logger.debug('chat() -> chat input', { input });

    const userMessage = {
      role: ChatMessageRole.USER,
      text: input,
      image,
    } as UserChatMessage;

    this.emit('chat', {
      message: input,
      memory: this.memory.history,
      tools: this.tools,
    });

    const messages = this.preprocessMessages([...this.memory.history.flat(), userMessage]);

    const resultResponses = await this.chatCompletionModel.generate(messages, this.tools);

    logger.debug('chat() -> chat response', { resultResponses });

    this.emit('chatResponse', {
      response: resultResponses,
      memory: this.memory.history,
      tools: this.tools,
    });

    this.memory.addMessage(userMessage, convertResponseToChatMessage(resultResponses[0]));

    // This step probably would be looped until the response is text content
    const returnContents = await this.runFunctionsOrReturnContents(resultResponses[0]);

    return returnContents;
  }

  public chatStream(
    input: string
  ): Promise<AsyncGenerator<TextModelResponse<ChatCompletionResponse>>> {
    logger.debug('chatStream() -> received chat input', { input });

    this.emit('chat', {
      message: input,
      memory: this.memory.history,
      tools: this.tools,
    });

    return new Promise((resolve, reject) => {
      const userMessage = {
        role: ChatMessageRole.USER,
        text: input,
      } as UserChatMessage;

      this.chatCompletionModel
        .generateStream([...this.memory.history.flat(), userMessage], this.tools)
        .then(stream => {
          // eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment
          const self = this;
          const generator = (async function* generator() {
            for await (const resultResponses of stream) {
              logger.debug('chatStream() -> received chat response', { resultResponses });

              self.emit('chatResponse', {
                response: resultResponses,
                memory: self.memory.history,
                tools: self.tools,
              });

              self.memory.addMessage(userMessage, convertResponseToChatMessage(resultResponses[0]));

              // self step probably would be looped until the response is text content
              const returnContents = await self.runFunctionsOrReturnContents(resultResponses[0]);

              yield returnContents;
            }
          })();

          return resolve(generator);
        })
        .catch(reject);
    });
  }

  protected async runFunctionsOrReturnContents(
    response: TextModelResponse<ChatCompletionResponse>
  ): Promise<TextModelResponse<ChatCompletionResponse>> {
    if (response.response.type === ChatCompletionResponseType.FUNCTION_CALL) {
      const tool = this.tools.find(
        ({ name }) => name === (response.response as ChatCompletionFunctionCallResponse).name
      );

      if (!tool) {
        logger.debug('runFunctionsOrReturnContents() -> function not found', { response });

        throw new ChatAgentFunctionCallNotFoundError();
      }

      try {
        const functionCallResponse = await tool.execute(response.response.args);

        this.emit('toolExecuted', tool.name, response.response.args, functionCallResponse);

        // push the function call to the accumulator
        const functionCallExecutedMessage = {
          role: ChatMessageRole.TOOL,
          functionCallResponse: {
            id: response.response.id,
            name: tool.name,
            args: response.response.args,
            response: {
              content: functionCallResponse,
            },
          },
        } as FunctionCallResponseChatMessage;

        logger.debug('runFunctionsOrReturnContents() -> function call executed messages:', {
          functionCallExecutedMessage,
        });

        const messages = this.preprocessMessages([
          ...this.memory.history.flat(),
          functionCallExecutedMessage,
        ]);

        // If there are function calls, return their executed responses to generative AI
        const functionCallResponses = await this.chatCompletionModel.generate(messages, this.tools);

        this.memory.addMessage(
          functionCallExecutedMessage,
          convertResponseToChatMessage(functionCallResponses[0])
        );

        return await this.runFunctionsOrReturnContents(functionCallResponses[0]);
      } catch (error) {
        logger.error('runFunctionsOrReturnContents() -> error calling function', { error });

        return {
          finishReason: TextModelFinishReason.STOP,
          response: {
            text: 'Sorry, something went wrong. Please try again later.',
            type: ChatCompletionResponseType.TEXT,
          },
        } as TextModelResponse<ChatCompletionResponse>;
      }
    }

    // TODO: support other response types, eg. image, audio, etc.
    if (response.response.type !== ChatCompletionResponseType.TEXT) {
      throw new ChatAgentGenerateError();
    }

    return response;
  }
}
