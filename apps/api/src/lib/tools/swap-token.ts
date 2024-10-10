import { FunctionParameter, FunctionParameterType, Tool } from './tool';
import { logger } from '../logger';

export interface TokenSwapToolFunctionArgs {
  symbol: string; // e.g. BTC, ETH, SOL
  amount: number;
}

export interface TokenSwapToolFunctionResponse {
  mintAddress: string;
  amount: number;
}

const mintAddressMapping = new Map<string, string>([
  ['USDC', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'],
  ['USDT', 'BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4'],
  ['RAY', '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'],
]);

export class TokenSwapTool extends Tool<TokenSwapToolFunctionArgs, TokenSwapToolFunctionResponse> {
  public readonly name = 'swap-token';

  public readonly description =
    'This is useful whe you have to get the swap a token on Solana blockchain. This tool only support swapping from SOL to USDC, USDT, or RAY. Please confirm the amount and the token symbol before proceeding. The tool will return the mint address and the amount of the token to swap and it would open a new wallet APP to process the swap.';

  public readonly parameters: FunctionParameter = {
    type: FunctionParameterType.OBJECT,
    properties: {
      symbol: {
        type: FunctionParameterType.STRING,
      },
      amount: {
        type: FunctionParameterType.NUMBER,
      },
    },
    required: ['symbol', 'amount'],
  };

  public async execute(args: TokenSwapToolFunctionArgs): Promise<TokenSwapToolFunctionResponse> {
    logger.debug('TokenSwapTool.execute() -> args:', { args });

    const mintAddress = mintAddressMapping.get(args.symbol);

    if (!mintAddress) {
      throw new Error(`Token ${args.symbol} is not supported`);
    }

    return {
      mintAddress,
      amount: args.amount,
    };
  }
}
