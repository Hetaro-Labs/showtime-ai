import { customsearch_v1, google } from 'googleapis';
import { FunctionParameter, FunctionParameterType, Tool } from './tool';
import { logger } from '../logger';

const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY as string;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID as string;

export interface GoogleSearchToolFunctionArgs {
  query: string;
}

export interface GoogleSearchToolFunctionResponse {
  results: string;
}

export interface GoogleSearchToolParams {
  numResults?: number;
}

export class GoogleSearchTool extends Tool<
  GoogleSearchToolFunctionArgs,
  GoogleSearchToolFunctionResponse
> {
  public name = 'google_search';

  public description =
    'A wrapper around Google Search.\nUseful for when you need to answer questions about current events, real-time information and news.\nInput should be a search query';

  private numResults: number;

  public parameters: FunctionParameter = {
    type: FunctionParameterType.OBJECT,
    properties: {
      query: {
        type: FunctionParameterType.STRING,
      },
    },
    required: ['query'],
  };

  protected customsearch: customsearch_v1.Customsearch;

  constructor(params?: GoogleSearchToolParams) {
    super();

    this.numResults = params?.numResults || 4;

    this.customsearch = google.customsearch({
      version: 'v1',
      auth: GOOGLE_CSE_API_KEY,
    });
  }

  public async execute(
    args: GoogleSearchToolFunctionArgs
  ): Promise<GoogleSearchToolFunctionResponse> {
    logger.debug('GoogleSearchTool.execute() -> args', { args });

    try {
      const searchResults = await this.customsearch.cse.list({
        q: args.query,
        cx: GOOGLE_CSE_ID,
        num: this.numResults,
      });

      if (!searchResults.data.items) {
        return { results: 'No good Google Search Result was found' };
      }

      const results = searchResults.data.items
        .map((item, index) => `${index + 1}. [${item.title}](${item.link})\n${item.snippet}`)
        .join('\n\n');

      logger.debug('GoogleSearchTool.execute() -> results:', { results });

      return { results };
    } catch (error) {
      logger.debug('GoogleSearchTool.execute() -> error:', { error });

      return { results: 'No good Google Search Result was found' };
    }
  }
}
