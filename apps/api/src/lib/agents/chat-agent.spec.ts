import { DummyChatCompletion } from '../../../test/dummy-vertexai-model';
import { DummyWeatherTool } from '../../../test/dummy-weather-tool';
import {
  ChatCompletionFunctionCallResponse,
  ChatCompletionResponseType,
} from '../text-models/chat-completion';
import { TextModelFinishReason } from '../text-models/text-model';
import { ChatAgent } from './chat-agent';
import { Memory } from '../memory';
import { AssistantChatMessage, ChatMessageRole, UserChatMessage } from '../text-models';

describe.only('ChatAgent', () => {
  it('should create a chat agent', () => {
    const dummyModel = new DummyChatCompletion();
    const chatAgent = new ChatAgent({
      systemInstruction: 'You are modeling the mind of Samantha.',
      chatCompletionModel: dummyModel,
    });

    expect(chatAgent).toBeInstanceOf(ChatAgent);
  });

  describe('chat()', () => {
    it('should send a message', async () => {
      const dummyModel = new DummyChatCompletion();
      const chatAgent = new ChatAgent({
        systemInstruction: 'You are modeling the mind of Samantha.',
        chatCompletionModel: dummyModel,
      });
      const response = await chatAgent.chat('Hello, how are you?');

      expect(response.finishReason).toBe(TextModelFinishReason.STOP);
      expect(response.response.type).toBe(ChatCompletionResponseType.TEXT);
      expect((response.response as any).text).toBe('I am a dummy reply');
    });

    it('should call a tool function', async () => {
      const dummyModel = new DummyChatCompletion([
        {
          type: ChatCompletionResponseType.FUNCTION_CALL,
          name: 'get_current_weather',
          id: '123',
          args: {
            location: 'New York',
          },
        } as ChatCompletionFunctionCallResponse,
        {
          type: ChatCompletionResponseType.TEXT,
          text: 'It is sunny today.',
        },
      ]);
      const chatAgent = new ChatAgent({
        systemInstruction: 'You are modeling the mind of Samantha.',
        chatCompletionModel: dummyModel,
        tools: [new DummyWeatherTool()],
      });
      const response = await chatAgent.chat('How is the weather today in New York?');

      expect(response.finishReason).toBe(TextModelFinishReason.STOP);
      expect(response.response.type).toBe(ChatCompletionResponseType.TEXT);
      expect((response.response as any).text).toBe('It is sunny today.');
    });

    it('should send a message with history', async () => {
      const dummyModel = new DummyChatCompletion();
      const memory = new Memory();

      memory.addMessage(
        {
          role: ChatMessageRole.USER,
          text: 'Hello, how are you?',
        } as UserChatMessage,
        {
          role: ChatMessageRole.ASSISTANT,
          text: 'I am fine, thank you.',
        } as AssistantChatMessage
      );

      const chatAgent = new ChatAgent({
        systemInstruction: 'You are modeling the mind of Samantha.',
        chatCompletionModel: dummyModel,
        memory,
      });

      dummyModel.setDummyReplies([
        {
          type: ChatCompletionResponseType.TEXT,
          text: 'It is sunny today. Number of messages: {_input.length}',
        },
      ]);

      const response = await chatAgent.chat('How is the weather today in New York?');

      expect(response.finishReason).toBe(TextModelFinishReason.STOP);
      expect(response.response.type).toBe(ChatCompletionResponseType.TEXT);
      expect((response.response as any).text).toBe('It is sunny today. Number of messages: 4');
    });
  });

  describe('chatStream()', () => {
    it('should send a message with streaming', async () => {
      const dummyModel = new DummyChatCompletion([
        {
          type: ChatCompletionResponseType.TEXT,
          text: 'I am a dummy reply',
        },
      ]);
      const chatAgent = new ChatAgent({
        systemInstruction: 'You are modeling the mind of Samantha.',
        chatCompletionModel: dummyModel,
      });
      const stream = await chatAgent.chatStream('Hello, how are you?');
      const responses = [];

      for await (const response of stream) {
        responses.push(response);
      }

      expect(responses.length).toBe(1);
      expect(responses[0].finishReason).toBe(TextModelFinishReason.STOP);
      expect(responses[0].response.type).toBe(ChatCompletionResponseType.TEXT);
      expect((responses[0].response as any).text).toBe('I am a dummy reply');
    });

    it('should send a message with streaming and tools', async () => {
      const dummyModel = new DummyChatCompletion([
        {
          type: ChatCompletionResponseType.FUNCTION_CALL,
          name: 'get_current_weather',
          id: '123',
          args: {
            location: 'New York',
          },
        } as ChatCompletionFunctionCallResponse,
        {
          type: ChatCompletionResponseType.TEXT,
          text: 'It is sunny today.',
        },
      ]);
      const chatAgent = new ChatAgent({
        systemInstruction: 'You are modeling the mind of Samantha.',
        chatCompletionModel: dummyModel,
        tools: [new DummyWeatherTool()],
      });
      const stream = await chatAgent.chatStream('How is the weather today in New York?');

      const responses = [];

      for await (const response of stream) {
        responses.push(response);
      }

      expect(responses.length).toBe(1);
      expect(responses[0].finishReason).toBe(TextModelFinishReason.STOP);
      expect(responses[0].response.type).toBe(ChatCompletionResponseType.TEXT);
      expect((responses[0].response as any).text).toBe('It is sunny today.');
    });
  });
});
