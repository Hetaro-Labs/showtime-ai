import { FunctionParameter, FunctionParameterType } from '../tools';
import { ChatCompletionResponse, ChatCompletionResponseType } from './chat-completion';
import { ChatMessageRole, TextChatMessage } from './chat-message';
import { TextModelResponse } from './text-model';
import { VertexAIChatCompletion } from './vertexai';

describe.skip('VertexAIChatCompletion', () => {
  it('should create a generative model', () => {
    const chatCompletion = new VertexAIChatCompletion();

    expect(chatCompletion).toBeInstanceOf(VertexAIChatCompletion);
  });

  it('should generate a response', async () => {
    const chatCompletion = new VertexAIChatCompletion();

    const response = await chatCompletion.generate([
      {
        role: ChatMessageRole.USER,
        text: 'Hello, how are you?',
      } as TextChatMessage,
    ]);

    expect(response[0]).toHaveProperty('response.text');
  });

  it('should generate a response stream', async () => {
    const chatCompletion = new VertexAIChatCompletion();

    const stream = await chatCompletion.generateStream([
      {
        role: ChatMessageRole.USER,
        text: 'Hello, how are you?',
      } as TextChatMessage,
    ]);

    const responses = [];

    for await (const response of stream) {
      responses.push(response);
    }

    expect(responses.length).toBeGreaterThan(0);
  });

  it('should generate a response with tools', async () => {
    const chatCompletion = new VertexAIChatCompletion();

    const response = await chatCompletion.generate(
      [
        {
          role: ChatMessageRole.USER,
          text: 'How is the weather today in New York?',
        } as TextChatMessage,
      ],
      [
        {
          name: 'get_current_weather',
          description: 'get weather in a given location',
          parameters: {
            type: FunctionParameterType.OBJECT,
            properties: {
              location: {
                type: FunctionParameterType.STRING,
              },
            },
            required: ['location'],
          } as FunctionParameter,
          execute: () => {
            return Promise.resolve({ content: 'The weather is sunny' });
          },
        },
      ]
    );

    expect(response[0]).toHaveProperty('response.type', 'function');
  });

  it('should generate a response stream with tools', async () => {
    const chatCompletion = new VertexAIChatCompletion();

    const stream = await chatCompletion.generateStream(
      [
        {
          role: ChatMessageRole.USER,
          text: 'How is the weather today in New York?',
        } as TextChatMessage,
      ],
      [
        {
          name: 'get_current_weather',
          description: 'get weather in a given location',
          parameters: {
            type: FunctionParameterType.OBJECT,
            properties: {
              location: {
                type: FunctionParameterType.STRING,
              },
            },
            required: ['location'],
          } as FunctionParameter,
          execute: () => {
            return Promise.resolve({ content: 'The weather is sunny' });
          },
        },
      ]
    );

    let responses = [] as TextModelResponse<ChatCompletionResponse>[];

    for await (const response of stream) {
      responses = [...responses, ...response];
    }

    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0]).toHaveProperty('response.type', ChatCompletionResponseType.FUNCTION_CALL);
  });
});
