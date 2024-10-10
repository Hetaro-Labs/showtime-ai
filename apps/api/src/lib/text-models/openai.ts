import OpenAI from 'openai';
import type { ClientOptions } from 'openai';
import { logger } from '../logger';
import type {
  ChatCompletionFunctionCallResponse,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatCompletionTextResponse,
} from './chat-completion';
import { ChatCompletion, ChatCompletionResponseType } from './chat-completion';
import { TextModelFinishReason, TextModelGenerationError, TextModelResponse } from './text-model';
import { FunctionParameterType, Tool } from '../tools/tool';
import { ChatMessage, ChatMessageRole } from './chat-message';

export interface OpenAIChatCompletionParams extends ChatCompletionParams {
  model: string;
  options?: ClientOptions;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
}

const getOpenAIRole = (role: ChatMessageRole) => {
  switch (role) {
    case ChatMessageRole.USER: {
      return 'user';
    }

    case ChatMessageRole.ASSISTANT: {
      return 'assistant';
    }

    case ChatMessageRole.FUNCTION: {
      return 'function';
    }

    case ChatMessageRole.SYSTEM: {
      return 'system';
    }

    default: {
      return 'user';
    }
  }
};

const getFinishReason = (
  finishReason: OpenAI.Chat.Completions.ChatCompletionChunk['choices'][0]['finish_reason']
): TextModelFinishReason => {
  switch (finishReason) {
    case 'stop': {
      return TextModelFinishReason.STOP;
    }

    case 'length': {
      return TextModelFinishReason.LENGTH;
    }

    case 'tool_calls': {
      return TextModelFinishReason.FUNCTION_CALL;
    }

    case 'content_filter': {
      return TextModelFinishReason.CONTENT_FILTER;
    }

    case 'function_call': {
      return TextModelFinishReason.FUNCTION_CALL;
    }

    case null: {
      return TextModelFinishReason.UNKNOWN;
    }

    default: {
      return TextModelFinishReason.UNKNOWN;
    }
  }
};

const getFunctionDeclaration = (tool: Tool): OpenAI.FunctionDefinition => {
  const propertyMap = new Map([
    [FunctionParameterType.STRING, 'string'],
    [FunctionParameterType.NUMBER, 'number'],
    [FunctionParameterType.INTEGER, 'integer'],
    [FunctionParameterType.BOOLEAN, 'boolean'],
    [FunctionParameterType.OBJECT, 'object'],
    [FunctionParameterType.ARRAY, 'array'],
  ]);
  const parameterType = propertyMap.get(tool.parameters.type);

  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: parameterType,
      properties: Object.keys(tool.parameters.properties).reduce((accumulator, key) => {
        accumulator[key] = {
          type: propertyMap.get(tool.parameters.properties[key].type),
          description: tool.parameters.properties[key].description,
          enum: tool.parameters.properties[key].enum,
        };

        return accumulator;
      }, {} as OpenAI.FunctionParameters),
    },
  } as OpenAI.FunctionDefinition;
};

export class OpenAIChatCompletion extends ChatCompletion {
  private openai: OpenAI;

  public model: string;

  public temperature?: number;

  public topP?: number;

  public topK?: number;

  public maxTokens?: number;

  constructor(params?: OpenAIChatCompletionParams) {
    super({
      systemInstruction: params?.systemInstruction,
    });
    this.openai = new OpenAI(params?.options);
    this.model = params?.model || 'gpt-3.5-turbo';
    this.temperature = params?.temperature || 1;
    this.topP = params?.topP;
    this.topK = params?.topK;
    this.maxTokens = params?.maxTokens;
  }

  private preProcessMessages(
    inputs: ChatMessage[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages = inputs.map(message => {
      const { role, text, image, functionCall, functionCallResponse } = message;

      if (functionCall) {
        let functionCallArgs = '';

        try {
          functionCallArgs = JSON.stringify(functionCall.args);
        } catch {
          // pass
        }

        return {
          role: 'assistant',
          tool_calls: [
            {
              id: functionCall.id,
              function: {
                name: functionCall.name,
                arguments: functionCallArgs,
              },
              type: 'function',
            } as OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
          ],
        } as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam;
      }

      if (functionCallResponse) {
        return {
          role: 'tool',
          tool_call_id: functionCallResponse.id,
          content: JSON.stringify(functionCallResponse.response),
        } as OpenAI.Chat.Completions.ChatCompletionToolMessageParam;
      }

      const messageRole = getOpenAIRole(role);
      const parts = [] as OpenAI.Chat.Completions.ChatCompletionContentPart[];

      if (text) {
        parts.push({
          text,
          type: 'text',
        } as OpenAI.Chat.Completions.ChatCompletionContentPartText);
      }

      if (image) {
        parts.push({
          type: 'image_url',
          image_url: {
            url: image.imageUri,
            detail: 'high',
          },
        } as OpenAI.Chat.Completions.ChatCompletionContentPartImage);
      }

      if (parts.length > 0) {
        return {
          role: messageRole,
          content: parts,
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
      }

      throw new TextModelGenerationError('Invalid input');
    });

    // add system instruction
    messages.unshift({
      role: 'system',
      content: this.systemInstruction,
    } as OpenAI.Chat.Completions.ChatCompletionSystemMessageParam);

    return messages;
  }

  private postProcessResponse(
    result: OpenAI.Chat.Completions.ChatCompletion | OpenAI.Chat.Completions.ChatCompletionChunk
  ): Array<TextModelResponse<ChatCompletionResponse>> {
    if (result.choices.length === 0) {
      throw new TextModelGenerationError('No candidates found');
    }

    const message =
      'message' in result.choices[0] ? result.choices[0].message : result.choices[0].delta;
    const finishReason = getFinishReason(result.choices[0].finish_reason);
    const toolCalls = message.tool_calls;

    if (toolCalls) {
      return toolCalls
        .map(toolCall => {
          if (!toolCall.function || !toolCall.function.arguments) {
            return null;
          }

          return {
            finishReason,
            response: {
              id: toolCall.id,
              type: ChatCompletionResponseType.FUNCTION_CALL,
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments),
            },
          } as TextModelResponse<ChatCompletionFunctionCallResponse>;
        })
        .filter(Boolean) as TextModelResponse<ChatCompletionFunctionCallResponse>[];
    }

    // TODO: handle other content type, eg: image? audio?
    const textResponse = message.content;

    if (!textResponse) {
      throw new TextModelGenerationError('No content found');
    }

    const returnContents = [
      {
        finishReason,
        response: {
          text: textResponse,
          type: ChatCompletionResponseType.TEXT,
        },
      } as TextModelResponse<ChatCompletionTextResponse>,
    ];

    return returnContents;
  }

  public async generate(inputs: ChatMessage[], tools?: Tool[]) {
    const requestTools = [] as OpenAI.Chat.Completions.ChatCompletionTool[];

    if (tools && tools.length > 0) {
      for (const tool of tools) {
        requestTools.push({
          type: 'function',
          function: getFunctionDeclaration(tool),
        } as OpenAI.Chat.Completions.ChatCompletionTool);
      }
    }

    const messages = this.preProcessMessages(inputs);

    logger.debug('generate() -> input:', { messages });

    const result = await this.openai.chat.completions.create({
      messages,
      tools: requestTools,
      model: this.model,
      temperature: this.temperature,
      top_p: this.topP,
      max_tokens: this.maxTokens,
    });

    logger.debug('generate() -> result:', { result });

    const postProcessedResponse = this.postProcessResponse(result);

    return postProcessedResponse;
  }

  public async generateStream(
    inputs: ChatMessage[],
    tools?: Tool[]
  ): Promise<AsyncGenerator<Array<TextModelResponse<ChatCompletionResponse>>>> {
    return new Promise((resolve, reject) => {
      const requestTools = [] as OpenAI.Chat.Completions.ChatCompletionTool[];

      if (tools && tools.length > 0) {
        for (const tool of tools) {
          requestTools.push({
            type: 'function',
            function: getFunctionDeclaration(tool),
          } as OpenAI.Chat.Completions.ChatCompletionTool);
        }
      }

      const messages = this.preProcessMessages(inputs);

      logger.debug('generateStream() -> input:', { messages });

      this.openai.chat.completions
        .create({
          messages,
          tools: requestTools,
          model: this.model,
          stream: true,
        })
        .then(stream => {
          // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
          const self = this;

          logger.debug('generateStream() -> stream:', { stream });

          const generator = (async function* generator() {
            // must be AsyncFunction to align with base class method, even though it's not async
            for await (const chunk of stream) {
              const postProcessedResponse = self.postProcessResponse(chunk);

              logger.debug('generateStream() -> chunk:', { postProcessedResponse });

              if (postProcessedResponse.length > 0) yield postProcessedResponse;
            }
          })();

          return resolve(generator);
        })
        .catch(reject);
    });
  }
}
