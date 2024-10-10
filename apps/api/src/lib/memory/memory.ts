import Debug from 'debug';
import { EventEmitter } from 'events';
import {
  AssistantChatMessage,
  Conversation,
  FunctionCallResponseChatMessage,
  UserChatMessage,
} from '../text-models/chat-message';

const debug = Debug('apps:memory');

interface AddMessageEvent {
  conversation: Conversation;
}

interface MemoryEvents {
  addMessage: (event: AddMessageEvent) => void;
}

export declare interface Memory {
  on<U extends keyof MemoryEvents>(event: U, listener: MemoryEvents[U]): this;
  emit<U extends keyof MemoryEvents>(event: U, ...args: Parameters<MemoryEvents[U]>): boolean;
}

export class Memory extends EventEmitter {
  constructor(public history: Conversation[] = []) {
    super();
  }

  public addMessage(
    userMessage: UserChatMessage | FunctionCallResponseChatMessage,
    assistantMessage: AssistantChatMessage
  ) {
    debug(`addMessage() -> message: `, { userMessage, assistantMessage });

    this.emit('addMessage', {
      conversation: [userMessage, assistantMessage],
    });
    this.history.push([userMessage, assistantMessage]);
  }

  public setHistory(history: Conversation[]) {
    this.history = history;
  }
}
