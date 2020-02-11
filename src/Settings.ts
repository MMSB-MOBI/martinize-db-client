import ApiHelper from "./ApiHelper";
import { User } from "./types/entities";

export enum LoginStatus {
  None, Pending, Curator, Admin,
};

export const Settings = new class Settings {
  protected _token?: string;
  protected _login_promise: Promise<boolean> = Promise.resolve(false);
  protected _logged = LoginStatus.None;
  protected _user?: User;

  constructor() {
    if (localStorage.getItem('token')) {
      this.token = localStorage.getItem('token')!;
    }
    if (localStorage.getItem('user')) {
      try {
        this.user = JSON.parse(localStorage.getItem('user')!);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    if (this.token) {
      this.verifyToken();
    }
  }

  set token(v: string | undefined) {
    this._token = v;
    if (!v) 
      localStorage.removeItem('token');
    else
      localStorage.setItem('token', v);
  }

  get token() {
    return this._token;
  }

  set user(v: User | undefined) {
    this._user = v;
    if (!v) 
      localStorage.removeItem('user');
    else
      localStorage.setItem('user', JSON.stringify(v));
  }

  get user() {
    if (this._logged)
      return this._user;
    return undefined;
  }

  get logged() {
    return this._logged;
  }

  get login_promise() {
    return this._login_promise;
  }

  verifyToken() {
    this._logged = LoginStatus.Pending;

    return this._login_promise = (async () => {
      await new Promise(resolve => setTimeout(resolve, 5));

      try {
        const user: User = await ApiHelper.request('user/validate');
        this.user = user;
        this._logged = user.role === "admin" ? LoginStatus.Admin : LoginStatus.Curator;
        return true;
      }
      catch (e) {
        this.user = undefined;
        this._logged = LoginStatus.None;
        if (ApiHelper.isFullApiError(e)) {
          // InvalidTokenError or ForbiddenError
          if (e[1].code === 202 || e[1].code === 201) {
            return false;
          }
        }
        console.error("Unable to verify login.", e);
        return false;
      }
    })();
  }

  async login(username: string, password: string) {
    return ApiHelper.request('user/login', { method: 'POST', parameters: { username, password } })
      .then(({ token, user }: { token: string, user: User }) => {
        this.token = token;
        this.user = user;
        this._logged = user.role === "admin" ? LoginStatus.Admin : LoginStatus.Curator;
        this._login_promise = Promise.resolve(true);
      });
  }

  unlog() {
    this.token = undefined;
    this.user = undefined;
    this._logged = LoginStatus.None;
    this._login_promise = Promise.resolve(false);
  }
}();

export default Settings;
