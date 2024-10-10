import axios, { AxiosError } from 'axios';
import { URLSearchParams } from 'node:url';
import { FunctionParameter, FunctionParameterType, Tool } from './tool';
import { logger } from '../logger';

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY as string;

export interface CryptoPriceToolFunctionArgs {
  symbol: string; // e.g. BTC, ETH, SOL
  currency: string; // e.g. USD, CNY, GBP
}

export interface CryptoPriceToolFunctionResponse {
  price: number; // usd
  symbol: string; // e.g. BTC, ETH, SOL
  name: string; // e.g. Bitcoin, Ethereum, Solana
  slug: string; // e.g. bitcoin, ethereum, solana
  timestamp: string; // 2018-06-22T19:34:33.000Z
}

const currencyCodeMapping = new Map(
  [
    ['United States Dollar ($)', 'USD', '2781'],
    // ['Albanian Lek (L)','ALL','3526'],
    // ['Algerian Dinar (د.ج)','DZD','3537'],
    // ['Argentine Peso ($)','ARS','2821'],
    // ['Armenian Dram (֏)','AMD','3527'],
    // ['Australian Dollar ($)','AUD','2782'],
    // ['Azerbaijani Manat (₼)','AZN','3528'],
    // ['Bahraini Dinar (.د.ب)','BHD','3531'],
    // ['Bangladeshi Taka (৳)','BDT','3530'],
    // ['Belarusian Ruble (Br)','BYN','3533'],
    // ['Bermudan Dollar ($)','BMD','3532'],
    // ['Bolivian Boliviano (Bs.)','BOB','2832'],
    // ['Bosnia-Herzegovina Convertible Mark (KM)','BAM','3529'],
    // ['Brazilian Real (R$)','BRL','2783'],
    // ['Bulgarian Lev (лв)','BGN','2814'],
    // ['Cambodian Riel (៛)','KHR','3549'],
    // ['Canadian Dollar ($)','CAD','2784'],
    // ['Chilean Peso ($)','CLP','2786'],
    ['Chinese Yuan (¥)', 'CNY', '2787'],
    // ['Colombian Peso ($)','COP','2820'],
    // ['Costa Rican Colón (₡)','CRC','3534'],
    // ['Croatian Kuna (kn)','HRK','2815'],
    // ['Cuban Peso ($)','CUP','3535'],
    // ['Czech Koruna (Kč)','CZK','2788'],
    // ['Danish Krone (kr)','DKK','2789'],
    // ['Dominican Peso ($)','DOP','3536'],
    // ['Egyptian Pound (£)','EGP','3538'],
    // ['Euro (€)','EUR','2790'],
    // ['Georgian Lari (₾)','GEL','3539'],
    // ['Ghanaian Cedi (₵)','GHS','3540'],
    // ['Guatemalan Quetzal (Q)','GTQ','3541'],
    // ['Honduran Lempira (L)','HNL','3542'],
    ['Hong Kong Dollar ($)', 'HKD', '2792'],
    // ['Hungarian Forint (Ft)','HUF','2793'],
    // ['Icelandic Króna (kr)','ISK','2818'],
    // ['Indian Rupee (₹)','INR','2796'],
    // ['Indonesian Rupiah (Rp)','IDR','2794'],
    // ['Iranian Rial (﷼)','IRR','3544'],
    // ['Iraqi Dinar (ع.د)','IQD','3543'],
    // ['Israeli New Shekel (₪)','ILS','2795'],
    // ['Jamaican Dollar ($)','JMD','3545'],
    // ['Japanese Yen (¥)','JPY','2797'],
    // ['Jordanian Dinar (د.ا)','JOD','3546'],
    // ['Kazakhstani Tenge (₸)','KZT','3551'],
    // ['Kenyan Shilling (Sh)','KES','3547'],
    // ['Kuwaiti Dinar (د.ك)','KWD','3550'],
    // ['Kyrgystani Som (с)','KGS','3548'],
    // ['Lebanese Pound (ل.ل)','LBP','3552'],
    // ['Macedonian Denar (ден)','MKD','3556'],
    // ['Malaysian Ringgit (RM)','MYR','2800'],
    // ['Mauritian Rupee (₨)','MUR','2816'],
    // ['Mexican Peso ($)','MXN','2799'],
    // ['Moldovan Leu (L)','MDL','3555'],
    // ['Mongolian Tugrik (₮)','MNT','3558'],
    // ['Moroccan Dirham (د.م.)','MAD','3554'],
    // ['Myanma Kyat (Ks)','MMK','3557'],
    // ['Namibian Dollar ($)','NAD','3559'],
    // ['Nepalese Rupee (₨)','NPR','3561'],
    ['New Taiwan Dollar (NT$)', 'TWD', '2811'],
    // ['New Zealand Dollar ($)','NZD','2802'],
    // ['Nicaraguan Córdoba (C$)','NIO','3560'],
    // ['Nigerian Naira (₦)','NGN','2819'],
    // ['Norwegian Krone (kr)','NOK','2801'],
    // ['Omani Rial (ر.ع.)','OMR','3562'],
    // ['Pakistani Rupee (₨)','PKR','2804'],
    // ['Panamanian Balboa (B/.)','PAB','3563'],
    // ['Peruvian Sol (S/.)','PEN','2822'],
    // ['Philippine Peso (₱)','PHP','2803'],
    // ['Polish Złoty (zł)','PLN','2805'],
    ['Pound Sterling (£)', 'GBP', '2791'],
    // ['Qatari Rial (ر.ق)','QAR','3564'],
    // ['Romanian Leu (lei)','RON','2817'],
    // ['Russian Ruble (₽)','RUB','2806'],
    // ['Saudi Riyal (ر.س)','SAR','3566'],
    // ['Serbian Dinar (дин.)','RSD','3565'],
    ['Singapore Dollar (S$)', 'SGD', '2808'],
    ['South African Rand (R)', 'ZAR', '2812'],
    ['South Korean Won (₩)', 'KRW', '2798'],
    // ['South Sudanese Pound (£)','SSP','3567'],
    // ['Sovereign Bolivar (Bs.)','VES','3573'],
    // ['Sri Lankan Rupee (Rs)','LKR','3553'],
    // ['Swedish Krona ( kr)','SEK','2807'],
    // ['Swiss Franc (Fr)','CHF','2785'],
    // ['Thai Baht (฿)','THB','2809'],
    // ['Trinidad and Tobago Dollar ($)','TTD','3569'],
    // ['Tunisian Dinar (د.ت)','TND','3568'],
    // ['Turkish Lira (₺)','TRY','2810'],
    // ['Ugandan Shilling (Sh)','UGX','3570'],
    ['Ukrainian Hryvnia (₴)', 'UAH', '2824'],
    // ['United Arab Emirates Dirham (د.إ)','AED','2813'],
    // ['Uruguayan Peso ($)','UYU','3571'],
    // ['Uzbekistan Som (so\'m)','UZS','3572'],
    // ['Vietnamese Dong (₫)','VND','2823'],
  ].map(([_, code, id]) => [code, id])
);

export class CryptoPriceTool extends Tool<
  CryptoPriceToolFunctionArgs,
  CryptoPriceToolFunctionResponse
> {
  public readonly name = 'crypto-price';

  public readonly description =
    'This is useful whe you have to get the current price of a cryptocurrency';

  public readonly parameters: FunctionParameter = {
    type: FunctionParameterType.OBJECT,
    properties: {
      symbol: {
        type: FunctionParameterType.STRING,
      },
      currency: {
        type: FunctionParameterType.STRING,
        enum: [...currencyCodeMapping.keys()],
      },
    },
    required: ['symbol'],
  };

  public async execute(
    args: CryptoPriceToolFunctionArgs
  ): Promise<CryptoPriceToolFunctionResponse> {
    logger.debug('CryptoPriceTool.execute() -> args:', { args });

    const queryParams = new URLSearchParams();

    queryParams.append('convert', args.currency || 'USD');
    queryParams.append('symbol', args.symbol);

    try {
      const response = await axios.get(
        `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?${queryParams.toString()}`,
        {
          responseType: 'json',
          headers: {
            'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
          },
        }
      );
      const { data } = response;
      const key = Object.keys(data.data)[0];
      const priceData = data.data[key];
      const { quote } = priceData[0];
      const quoteKey = Object.keys(quote)[0];

      return {
        price: quote[quoteKey].price,
        timestamp: quote[quoteKey].timestamp,
        symbol: args.symbol,
        name: priceData.name,
        slug: priceData.slug,
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        logger.error('CryptoPriceTool.execute() -> error:', {
          status: error.response.status,
          data: error.response.data,
        });
      }

      throw error;
    }
  }
}
