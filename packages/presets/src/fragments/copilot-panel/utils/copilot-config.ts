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
} catch (e) {
  console.log(e);
}
export const CopilotConfig = keys;
