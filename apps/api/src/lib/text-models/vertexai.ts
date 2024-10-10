import type * as GoogleVertexAI from '@google-cloud/vertexai';
import {
  FinishReason,
  FunctionDeclarationSchemaType,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from '@google-cloud/vertexai';
import { GoogleAuthOptions } from 'google-auth-library';
import type {
  ChatCompletionFunctionCallResponse,
  ChatCompletionImageResponse,
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatCompletionTextResponse,
} from './chat-completion';
import { ChatCompletion, ChatCompletionResponseType } from './chat-completion';
import { ChatMessage, ChatMessageRole } from './chat-message';
import { FunctionParameterType, Tool } from '../tools/tool';
import { TextModelFinishReason, TextModelGenerationError, TextModelResponse } from './text-model';
import { logger } from '../logger';

// This is the GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable only for local development
const GOOGLE_APPLICATION_CREDENTIALS_BASE64 = process.env
  .GOOGLE_APPLICATION_CREDENTIALS_BASE64 as string;

export interface VertexAIChatCompletionParams extends ChatCompletionParams {
  project?: string;
  location?: string;
  textModel?: string;
  searchGrounding?: boolean;
  generationConfig?: GoogleVertexAI.GenerationConfig;
}

export class VertexAIChatCompletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VertexAIChatCompletionError';
  }
}

// This function is used to convert the tool object to a vertex ai function declaration object
const getFunctionDeclarations = (tool: Tool): GoogleVertexAI.FunctionDeclaration => {
  const propertyMap = new Map([
    [FunctionParameterType.STRING, FunctionDeclarationSchemaType.STRING],
    [FunctionParameterType.NUMBER, FunctionDeclarationSchemaType.NUMBER],
    [FunctionParameterType.BOOLEAN, FunctionDeclarationSchemaType.BOOLEAN],
    [FunctionParameterType.OBJECT, FunctionDeclarationSchemaType.OBJECT],
    [FunctionParameterType.ARRAY, FunctionDeclarationSchemaType.ARRAY],
    [FunctionParameterType.INTEGER, FunctionDeclarationSchemaType.INTEGER],
  ]);
  const parameterType = propertyMap.get(tool.parameters.type);

  if (!parameterType) {
    throw new Error(`Unsupported parameter type: ${tool.parameters.type}`);
  }

  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: parameterType,
      properties: Object.keys(tool.parameters.properties).reduce(
        (accumulator, key) => {
          accumulator[key] = {
            type: propertyMap.get(tool.parameters.properties[key].type),
            description: tool.parameters.properties[key].description,
            enum: tool.parameters.properties[key].enum,
          };

          return accumulator;
        },
        {} as GoogleVertexAI.FunctionDeclarationSchema['properties']
      ),
      required: tool.parameters.required,
    },
  };
};

const getRole = (role: ChatMessageRole) => {
  switch (role) {
    case ChatMessageRole.USER:
    case ChatMessageRole.FUNCTION:
    case ChatMessageRole.TOOL:
    case ChatMessageRole.SYSTEM: {
      return 'user';
    }

    case ChatMessageRole.ASSISTANT: {
      return 'model';
    }

    default: {
      throw new VertexAIChatCompletionError('Unsupported role');
    }
  }
};

const getFinishReason = (finishReason: FinishReason | undefined): TextModelFinishReason => {
  switch (finishReason) {
    case FinishReason.STOP: {
      return TextModelFinishReason.STOP;
    }

    case FinishReason.MAX_TOKENS: {
      return TextModelFinishReason.LENGTH;
    }

    case FinishReason.OTHER:
    case FinishReason.FINISH_REASON_UNSPECIFIED: {
      return TextModelFinishReason.OTHER;
    }

    case FinishReason.SAFETY:
    case FinishReason.RECITATION:
    case FinishReason.BLOCKLIST:
    case FinishReason.PROHIBITED_CONTENT:
    case FinishReason.SPII: {
      return TextModelFinishReason.CONTENT_FILTER;
    }

    default: {
      return TextModelFinishReason.UNKNOWN;
    }
  }
};

export class VertexAIChatCompletion extends ChatCompletion {
  private textModel: GoogleVertexAI.GenerativeModelPreview;

  constructor(public params?: VertexAIChatCompletionParams) {
    super({
      systemInstruction: params?.systemInstruction,
    });

    const project = params?.project || (process.env.GOOGLE_CLOUD_PROJECT as string);
    const location = params?.location || (process.env.GOOGLE_CLOUD_LOCATION as string);
    const textModel = params?.textModel || (process.env.GOOGLE_VERTEXAI_TEXT_MODEL as string);
    let googleAuthOptions: GoogleAuthOptions | undefined;

    if (GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
      try {
        googleAuthOptions = {
          credentials: JSON.parse(
            Buffer.from(GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString()
          ),
        };
      } catch (error) {
        logger.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_BASE64', { error });
      }
    }

    const vertexAI = new VertexAI({
      project,
      location,
      googleAuthOptions,
    });
    const generationConfig = params?.generationConfig || {
      maxOutputTokens: 8192,
      temperature: 0.85,
      topP: 0.95,
      // candidateCount,
      // stopSequences,
      // temperature,
      // topP,
      // topK,
    };

    this.textModel = vertexAI.preview.getGenerativeModel({
      model: textModel,
      generationConfig,
      // The following parameters are optional
      // They can also be passed to individual content generation requests
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      systemInstruction: this.systemInstruction,
    });
  }

  private preProcessInput(input: ChatMessage[]) {
    const contents = input.map(({ role, text, image, functionCall, functionCallResponse }) => {
      const messageRole = getRole(role);
      const parts = [] as GoogleVertexAI.Part[];

      if (text) {
        parts.push({
          text,
        });
      }

      if (image) {
        parts.push({
          inlineData: {
            data: image.imageUri,
            mimeType: image.mimeType,
          },
        });
      }

      if (functionCall) {
        parts.push({
          functionCall: {
            name: functionCall.name,
            args: functionCall.args,
          },
        });
      }

      if (functionCallResponse) {
        parts.push({
          functionResponse: {
            name: functionCallResponse.name,
            response: functionCallResponse.response,
          },
        });
      }

      if (parts.length === 0) {
        throw new VertexAIChatCompletionError('No content found');
      }

      return {
        role: messageRole,
        parts,
      } as GoogleVertexAI.Content;
    });

    return contents;
  }

  private postProcessResponse(response: GoogleVertexAI.GenerateContentResponse) {
    if (!response.candidates) {
      throw new TextModelGenerationError('No candidates found');
    }

    const finishReason = getFinishReason(response.candidates[0].finishReason);
    const contentPart = response.candidates?.[0].content.parts[0];

    if (contentPart.text !== undefined) {
      return [
        {
          finishReason,
          response: {
            type: ChatCompletionResponseType.TEXT,
            text: contentPart.text,
          },
        } as TextModelResponse<ChatCompletionTextResponse>,
      ];
    }

    if (contentPart.functionCall !== undefined) {
      return [
        {
          finishReason,
          response: {
            id: contentPart.functionCall.name,
            type: ChatCompletionResponseType.FUNCTION_CALL,
            name: contentPart.functionCall.name,
            args: contentPart.functionCall.args,
          },
        } as TextModelResponse<ChatCompletionFunctionCallResponse>,
      ];
    }

    if (contentPart.inlineData !== undefined) {
      return [
        {
          finishReason,
          response: {
            type: ChatCompletionResponseType.IMAGE,
            imageUri: contentPart.inlineData.data,
            mimeType: contentPart.inlineData.mimeType,
          },
        } as TextModelResponse<ChatCompletionImageResponse>,
      ];
    }

    return [];
  }

  public async generate(input: ChatMessage[], tools?: Tool[]) {
    const requestTools = [] as GoogleVertexAI.Tool[];

    if (this.params?.searchGrounding) {
      requestTools.push(
        {
          googleSearchRetrieval: {
            disableAttribution: false,
          },
        } as GoogleVertexAI.GoogleSearchRetrievalTool // Grounding using Google Search
      );
    }

    if (tools && tools.length > 0) {
      const functionDeclarations = tools.map(tool => getFunctionDeclarations(tool));

      requestTools.push({
        functionDeclarations,
      });
    }

    const contents = this.preProcessInput(input);

    logger.debug('generate() -> contents: %s, tools: %s', { contents, requestTools });

    try {
      const result = await this.textModel.generateContent({
        contents,
        systemInstruction: this.systemInstruction,
        tools: requestTools,
      });

      logger.debug('generate() -> result: %s', { result });

      const processedResponse = this.postProcessResponse(result.response);

      logger.debug('generate() -> processedResponse: %O', { processedResponse });

      return processedResponse;
    } catch (error) {
      logger.debug('generate() -> error: %O', error);

      throw new VertexAIChatCompletionError('Error generating content');
    }
  }

  public async generateStream(
    input: ChatMessage[],
    tools?: Tool[]
  ): Promise<AsyncGenerator<Array<TextModelResponse<ChatCompletionResponse>>>> {
    return new Promise((resolve, reject) => {
      const requestTools = [];

      if (this.params?.searchGrounding) {
        requestTools.push(
          {
            googleSearchRetrieval: {
              disableAttribution: false,
            },
          } as GoogleVertexAI.GoogleSearchRetrievalTool // Grounding using Google Search
        );
      }

      if (tools && tools.length > 0) {
        const functionDeclarations = tools.map(tool => getFunctionDeclarations(tool));

        requestTools.push({
          functionDeclarations,
        });
      }

      const contents = this.preProcessInput(input);

      logger.debug('generateStream() -> contents: %s, tools: %s', { contents, requestTools });

      this.textModel
        .generateContentStream({
          contents,
          systemInstruction: this.systemInstruction,
          tools: requestTools,
        })
        // eslint-disable-next-line promise/always-return
        .then(async streamingResult => {
          // eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment
          const self = this;

          const generator = (async function* generator() {
            for await (const response of streamingResult.stream) {
              logger.debug('generateStream() -> streamingResponse: %s', { response });

              const processedResponse = self.postProcessResponse(response);

              logger.debug('generateStream() -> processedResponse: %s', { processedResponse });

              if (
                processedResponse.some(
                  ({ finishReason }) => finishReason === TextModelFinishReason.STOP
                )
              ) {
                yield processedResponse;
                break;
              }

              yield processedResponse;
            }
          })();

          resolve(generator);

          const aggregatedResponse = await streamingResult.response;

          logger.debug('generateStream() -> processedResponse: %s', aggregatedResponse);
        })
        .catch(reject);
    });
  }
}
