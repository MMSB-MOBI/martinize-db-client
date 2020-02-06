
export const Settings = new class Settings {
  protected _token: string;

  constructor() {
    if (localStorage.getItem('token')) {
      this.token = localStorage.getItem('token');
    }
  }

  set token(v: string) {
    this._token = v;
    localStorage.setItem('token', v);
  }

  get token() {
    return this._token;
  }
}();

export default Settings;
