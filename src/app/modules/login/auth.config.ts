import { AuthConfig } from 'angular-oauth2-oidc';

export const authCodeFlowConfig: AuthConfig = {
  issuer: 'https://login.bpk.go.id',
  // redirectUri: window.location.origin + '/sso/callback',
//   redirectUri: 'http://localhost:8000/sso/callback',
  redirectUri: 'https://api.skema.co.id/sso/callback',
  clientId: 'ca43969d-04a7-4366-baba-51cf79283c91',
  responseType: 'code', 
  scope: 'openid profile email',
  showDebugInformation: true,
  timeoutFactor: 0.01,
  clearHashAfterLogin: true,
  requireHttps: false,
  tokenEndpoint: 'https://login.bpk.go.id/connect/token',

  useHttpBasicAuth: true,
  dummyClientSecret: '1c13dcf2-7b31-4b8c-b577-f25e28291d2a'
};