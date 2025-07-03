import axios from 'axios';

export interface FyersConfig {
  clientId: string;
  secretKey: string;
  redirectUri: string;
}

export interface FyersTokenResponse {
  s: string;
  code: number;
  message: string;
  access_token?: string;
  refresh_token?: string;
}

export class FyersAuth {
  private config: FyersConfig;
  
  constructor(config: FyersConfig) {
    this.config = config;
  }

  generateAuthUrl(): string {
    const baseUrl = 'https://api-t1.fyers.in/api/v3/generate-authcode';
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state: 'sample_state'
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  async generateAccessToken(authCode: string): Promise<string> {
    const url = 'https://api-t1.fyers.in/api/v3/validate-authcode';
    
    const appIdHash = await this.generateAppIdHash();
    
    const payload = {
      grant_type: 'authorization_code',
      appIdHash: appIdHash,
      code: authCode
    };

    try {
      console.log('Authenticating with Fyers API...');
      console.log('Payload:', { ...payload, appIdHash: 'HIDDEN' });
      
      const response = await axios.post<FyersTokenResponse>(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Fyers auth response:', response.data);

      if (response.data.s === 'ok' && response.data.access_token) {
        console.log('Successfully obtained access token');
        return response.data.access_token;
      } else {
        throw new Error(`Token generation failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Fyers authentication error:', error.response?.data || error.message);
      throw new Error(`Failed to generate access token: ${error.response?.data?.message || error.message}`);
    }
  }

  private async generateAppIdHash(): Promise<string> {
    const crypto = await import('crypto');
    const message = `${this.config.clientId}:${this.config.secretKey}`;
    const hash = crypto.createHash('sha256').update(message).digest('hex');
    console.log('Generated app ID hash for authentication');
    return hash;
  }

  async getQuotes(symbols: string[], accessToken: string): Promise<any> {
    // Try multiple endpoint variations based on Fyers API documentation
    const endpoints = [
      'https://api-t1.fyers.in/data-rest/v2/quotes',
      'https://api-t1.fyers.in/api/v3/data/quotes',
      'https://api-t1.fyers.in/data/quotes'
    ];
    
    for (const url of endpoints) {
      try {
        const symbolsParam = symbols.join(',');
        console.log(`Trying endpoint: ${url}`);
        console.log('Symbols:', symbolsParam);
        
        const response = await axios.get(url, {
          params: {
            symbols: symbolsParam
          },
          headers: {
            'Authorization': `${this.config.clientId}:${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Quotes API response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error(`Endpoint ${url} failed:`, error.response?.status || error.message);
        continue; // Try next endpoint
      }
    }
    
    // If all quote endpoints fail, try individual symbol requests
    try {
      console.log('Trying individual symbol requests...');
      const results = [];
      
      for (const symbol of symbols.slice(0, 5)) { // Limit to 5 symbols to avoid rate limits
        try {
          const response = await axios.get('https://api-t1.fyers.in/data-rest/v2/quotes', {
            params: {
              symbols: symbol
            },
            headers: {
              'Authorization': `${this.config.clientId}:${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data) {
            results.push(response.data);
          }
        } catch (symbolError) {
          console.error(`Failed to fetch ${symbol}:`, symbolError.response?.status);
        }
      }
      
      if (results.length > 0) {
        console.log(`Successfully fetched ${results.length} individual quotes`);
        return { s: 'ok', d: results };
      }
    } catch (individualError: any) {
      console.error('Individual requests also failed:', individualError.message);
    }
    
    throw new Error('All Fyers API endpoints failed. The API might be unavailable or require different authentication.');
  }
}