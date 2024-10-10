import { Datastore } from '@google-cloud/datastore';
import { createClient } from 'redis';
import { logger } from './logger';
import { ChatMessageRole, type Conversation } from './text-models';

const GOOGLE_APPLICATION_CREDENTIALS_BASE64 = process.env
  .GOOGLE_APPLICATION_CREDENTIALS_BASE64 as string;
const GOOGLE_CLOUD_DATASTORE_DATABASE = process.env.GOOGLE_CLOUD_DATASTORE_DATABASE as string;
const REDIS_URL = process.env.REDIS_URL as string;

export interface UserSessionItem {
  history: Conversation[];
  documents: UserSessionManagerDocument[];
}

export interface UserSessionItemForCache extends UserSessionItem {
  cached: boolean;
  updatedAt: Date;
}

export interface UserSessionManagerDocument {
  id: string; // incremental id
  mimeType: string; // 'text/plain', 'application/json', 'image/png', etc.
  url: string; // document url
  metadata?: Record<string, any>;
}

let credentials: any;

if (GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
  try {
    credentials = JSON.parse(
      Buffer.from(GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString()
    );
  } catch (error) {
    logger.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_BASE64', { error });
  }
}

// Create a Redis client
const redisClient = createClient({
  url: REDIS_URL,
});

// Handle errors
redisClient.on('error', error => {
  logger.error('initialize() -> error', { error });

  throw new Error('Error connecting to Redis');
});

const datastore = new Datastore({
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  projectId: process.env.GCP_PROJECT_ID,
  databaseId: GOOGLE_CLOUD_DATASTORE_DATABASE,
  credentials,
});

const getUserSessionFromRedis = async (userId: string): Promise<UserSessionItem | null> => {
  const key = `user-session:${userId}`;

  try {
    const record = await redisClient.get(key);

    if (!record) {
      return null;
    }

    const userHistory = JSON.parse(record);

    return userHistory as UserSessionItem;
  } catch (error) {
    logger.error('getUserSessionFromRedis -> error', { error });
  }

  return null;
};

const setUserSessionToRedis = async (userId: string, userHistory: UserSessionItem) => {
  const key = `user-session:${userId}`;
  const userHistoryJson = JSON.stringify(userHistory);

  await redisClient.set(key, userHistoryJson);
};

const deleteHistoryFromRedis = async (userId: string) => {
  const key = `user-session:${userId}`;

  await redisClient.del(key);
};

const getUserSessionFromDatastore = async (userId: string): Promise<UserSessionItem | null> => {
  try {
    const conversations = await datastore.get(datastore.key(['conversation', userId]));
    const documents = await datastore.get(datastore.key(['document', userId]));
    const userSession = {
      history: conversations || [],
      documents: documents || [],
      cached: true,
    } as UserSessionItem;

    return userSession;
  } catch (error) {
    logger.error('getUserSessionFromDatastore -> error', { error });
    // pass
  }

  return null;
};

const deleteHistoryFromDatastore = async (userId: string) => {
  const key = datastore.key(['UserSession', userId]);

  await datastore.delete(key);
};

const setUserSessionToDatastore = async (userId: string, userSession: UserSessionItem) => {
  const key = datastore.key(['UserSession', userId]);
  const userSessionJson = JSON.stringify(userSession);
  const entity = {
    key,
    data: {
      history: userSessionJson,
    },
    excludeFromIndexes: ['history'],
  };

  await datastore.save(entity);
};

// UserSessionManager is a Map that stores user history items, it would remove the oldest history if it exceeds the limit
export class UserSessionManager extends Map<string, UserSessionItemForCache> {
  constructor(
    public numberOfMaxCachedItems: number = 1000,
    public numberMaxHistoryPerUser: number = 3,
    public numberMaxDocumentPerUser: number = 3,
    ...args: any[]
  ) {
    super(...args);
  }

  private prepareCachedItems(userId: string): UserSessionItemForCache {
    const userSessionItem = this.get(userId);
    // check if the userId exists
    const isUserIdExists = !!userSessionItem;

    // remove oldest history if it exceeds the limit
    if (!isUserIdExists && this.size + 1 > this.numberOfMaxCachedItems) {
      // sort by date in ascending order
      const sortedItems = [...this.keys()]
        .map(key => this.get(key))
        .filter((item): item is UserSessionItemForCache => !!item)
        .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
      const oldestItem = sortedItems[0];
      const oldestItemUserId = [...this.keys()].find(key => this.get(key) === oldestItem);

      if (oldestItemUserId && oldestItemUserId !== userId) {
        this.delete(oldestItemUserId);
      }
    }

    return userSessionItem;
  }

  public async prepareUserSessionItem(userId: string): Promise<UserSessionItemForCache> {
    const userSessionItem: UserSessionItemForCache =
      this.get(userId) ||
      ({
        history: [],
        documents: [],
        cached: false,
        updatedAt: new Date(),
      } as UserSessionItemForCache);

    if (!userSessionItem.cached) {
      const redisCachedUserSession = await getUserSessionFromRedis(userId);

      if (redisCachedUserSession) {
        return {
          ...redisCachedUserSession,
          cached: true,
          updatedAt: new Date(),
        };
      }

      const datastoreCachedUserSession = await getUserSessionFromDatastore(userId);

      if (datastoreCachedUserSession) {
        return {
          ...datastoreCachedUserSession,
          cached: true,
          updatedAt: new Date(),
        };
      }
    }

    return userSessionItem;
  }

  public updateConversationHistory(
    userId: string,
    history: UserSessionItemForCache['history']
  ): UserSessionItemForCache {
    const userSessionItem = this.prepareCachedItems(userId);
    const updatedUserSessionItem = {
      ...userSessionItem,
      history,
      cached: true,
      updatedAt: new Date(),
    };

    logger.debug('UserSessionManager.updateConversationHistory() -> updatedUserSessionItem', {
      updatedUserSessionItem,
    });

    super.set(userId, updatedUserSessionItem);

    setUserSessionToRedis(userId, updatedUserSessionItem);
    setUserSessionToDatastore(userId, updatedUserSessionItem);

    return updatedUserSessionItem;
  }

  public updateDocumentHistory(userId: string, documents: UserSessionItem['documents']) {
    const userSessionItem = this.prepareCachedItems(userId);
    const updatedUserSessionItem = {
      ...userSessionItem,
      documents,
      cached: true,
      updatedAt: new Date(),
    };

    logger.debug('UserSessionManager.updateDocumentHistory() -> updatedUserSessionItem', {
      updatedUserSessionItem,
    });

    super.set(userId, updatedUserSessionItem);

    setUserSessionToRedis(userId, updatedUserSessionItem);
    setUserSessionToDatastore(userId, updatedUserSessionItem);
  }

  public get(userId: string, defaultItem?: UserSessionItemForCache): UserSessionItemForCache {
    const item = super.get(userId);

    if (item) {
      const historyLength = item.history.length;
      // fix inconsistent tool calling issue of OpenAI, remove the orphaned tool calling message

      item.history = item.history.filter((conversation, index) => {
        if (conversation[0].role === ChatMessageRole.TOOL && index === 0) {
          return false;
        }

        if (index < historyLength - 1) {
          const nextConversation = item.history[index + 1];

          if (conversation[1].functionCall && !nextConversation[0].functionCallResponse) {
            return false;
          }
        }

        return true;
      });

      return item;
    }

    return (
      defaultItem || {
        history: [],
        documents: [],
        cached: false,
        updatedAt: new Date(),
      }
    );
  }

  public addMessage(userId: string, conversation: Conversation) {
    const userSessionItem = this.get(userId);

    if (!userSessionItem) {
      this.updateConversationHistory(userId, [conversation]);

      return;
    }

    const updatedHistory = [...userSessionItem.history, conversation].slice(
      -this.numberMaxHistoryPerUser
    );

    this.updateConversationHistory(userId, updatedHistory);
  }

  public addDocument(userId: string, document: Omit<UserSessionManagerDocument, 'id'>): string {
    const userSessionItem = this.get(userId);
    const nextDocumentId =
      userSessionItem.documents.length > 0
        ? Math.max.apply(userSessionItem.documents.map(doc => doc.id)) + 1
        : 0;
    const newDocument = { ...document, id: nextDocumentId.toString() };

    if (!userSessionItem) {
      this.updateDocumentHistory(userId, [newDocument]);

      return newDocument.id;
    }

    const updatedDocuments = [...userSessionItem.documents, newDocument].slice(
      -this.numberMaxDocumentPerUser
    );

    this.updateDocumentHistory(userId, updatedDocuments);

    return newDocument.id;
  }

  public getDocumentById(documentId: string) {
    logger.debug('UserSessionManager.getDocumentById() -> documentId', { documentId });

    const items = [...this.values()];

    for (const item of items) {
      const document = item.documents.find(doc => doc.id === documentId);

      if (document) {
        return document;
      }
    }

    return null;
  }

  public delete(userId: string): boolean {
    try {
      deleteHistoryFromDatastore(userId);
      deleteHistoryFromRedis(userId);
    } catch {
      // pass
    }

    return super.delete(userId);
  }

  public connect() {
    return redisClient.connect();
  }
}
