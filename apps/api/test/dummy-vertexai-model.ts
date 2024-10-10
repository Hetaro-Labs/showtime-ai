import {
  ChatCompletion,
  ChatCompletionResponse,
  ChatCompletionResponseType,
  ChatCompletionTextResponse,
} from '../src/lib/text-models/chat-completion';
import { ChatMessage } from '../src/lib/text-models/chat-message';
import { TextModelFinishReason, TextModelResponse } from '../src/lib/text-models/text-model';
import { Tool } from '../src/lib/tools';

const DEFAULT_DUMMY_REPLY = {
  type: ChatCompletionResponseType.TEXT,
  text: 'I am a dummy reply',
} as ChatCompletionTextResponse;

export class DummyChatCompletion extends ChatCompletion {
  public numOfGenerations = 0;

  constructor(public dummyReplies: ChatCompletionResponse[] = [DEFAULT_DUMMY_REPLY]) {
    super();
  }

  public setDummyReplies(messages: ChatCompletionResponse[]) {
    this.dummyReplies = messages;
  }

  private processReply(
    reply: ChatCompletionResponse,
    _input: ChatMessage[],
    _tools?: Tool<any, object>[] | undefined
  ): ChatCompletionResponse {
    if (reply.type === ChatCompletionResponseType.TEXT) {
      const replacementMatches = reply.text.match(/{([^}]+)}/);

      if (replacementMatches) {
        const replacement = replacementMatches[1];
        // eslint-disable-next-line no-eval
        const replacementText = eval(replacement).toString();

        reply.text = reply.text.replace(`{${replacement}}`, replacementText);
      }

      return {
        type: ChatCompletionResponseType.TEXT,
        text: reply.text,
      } as ChatCompletionTextResponse;
    }

    return reply;
  }

  public generateStream(
    input: ChatMessage[],
    tools?: Tool<any, object>[] | undefined
  ): Promise<AsyncGenerator<TextModelResponse<ChatCompletionResponse>[], any, unknown>> {
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    const self = this;

    return new Promise((resolve, reject) => {
      if (self.numOfGenerations >= self.dummyReplies.length) {
        reject(new Error('No more dummy replies to generate'));
      }

      const generator = (async function* generator() {
        const dummyReply = self.processReply(
          self.dummyReplies[self.numOfGenerations],
          input,
          tools
        );

        self.numOfGenerations += 1;

        yield [
          {
            finishReason: TextModelFinishReason.STOP,
            response: dummyReply,
          } as TextModelResponse<ChatCompletionTextResponse>,
        ];
      })();

      resolve(generator);
    });
  }

  public async generate(
    input: ChatMessage[],
    tools?: Tool[]
  ): Promise<Array<TextModelResponse<ChatCompletionResponse>>> {
    if (this.numOfGenerations >= this.dummyReplies.length) {
      throw new Error('No more dummy replies to generate');
    }

    const dummyReply = this.processReply(this.dummyReplies[this.numOfGenerations], input, tools);

    this.numOfGenerations += 1;

    return [
      {
        finishReason: TextModelFinishReason.STOP,
        response: dummyReply,
      },
    ];
  }
}
