let keys = {
  SaveToLocalStorage: false,
  GPTAPIKey: '',
  FalAPIKey: '',
};
try {
  const result = JSON.parse(localStorage.getItem('APIKeys') ?? '');
  keys = {
    ...keys,
    GPTAPIKey: result.GPTAPIKey,
    FalAPIKey: result.FalAPIKey,
    SaveToLocalStorage: result.SaveToLocalStorage,
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (e) {
  //
}
export const CopilotConfig = keys;
