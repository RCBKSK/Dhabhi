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
  data?: {
    access_token: string;
    refresh_token: string;
  };
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
    
    const payload = {
      grant_type: 'authorization_code',
      appIdHash: await this.generateAppIdHash(),
      code: authCode
    };

    try {
      const response = await axios.post<FyersTokenResponse>(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.s === 'ok' && response.data.data?.access_token) {
        return response.data.data.access_token;
      } else {
        throw new Error(`Token generation failed: ${response.data.message}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  }

  private async generateAppIdHash(): Promise<string> {
    const crypto = await import('crypto');
    const message = `${this.config.clientId}:${this.config.secretKey}`;
    const hash = crypto.createHash('sha256').update(message).digest('hex');
    return hash;
  }

  async getQuotes(symbols: string[], accessToken: string): Promise<any> {
    const url = 'https://api-t1.fyers.in/api/v3/quotes';
    
    try {
      const response = await axios.get(url, {
        params: {
          symbols: symbols.join(',')
        },
        headers: {
          'Authorization': `${this.config.clientId}:${accessToken}`
        }
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch quotes: ${error.message}`);
    }
  }
}