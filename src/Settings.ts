import ApiHelper from "./ApiHelper";
import { User } from "./types/entities";
import { SettingsJson } from "./types/settings";
import { toast } from "./components/Toaster";

export enum LoginStatus {
  None, Pending, Curator, Admin,
};

export const Settings = new class Settings {
  protected _token?: string;
  protected _login_promise: Promise<boolean> = Promise.resolve(false);
  protected _settings_promise: Promise<void> = Promise.resolve();
  protected _logged = LoginStatus.None;
  protected _user?: User;
  protected _settings?: SettingsJson;

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
    this.downloadSettings();
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

  get is_fully_logged() {
    return this._logged > 1;
  }

  get login_promise() {
    return this._login_promise;
  }
  
  get martinize_variables() : SettingsJson {
    return this._settings ?? {
      force_fields: [],
      force_fields_info: {}, 
      create_way: {},
      category_tree: {}
    };
  }

  get martinize_variables_promise() {
    return this._settings_promise;
  }

  downloadSettings() {
    return this._settings_promise = (async () => {
      await new Promise(resolve => setTimeout(resolve, 5));

      try {
        const settings: SettingsJson = await ApiHelper.request('settings', { auth: false });
        this._settings = settings;
      }
      catch (e) {
        console.error(e);
        toast("Unable to connect to server. Please check your network settings.", "error");
      }
    })();
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
        throw e;
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

  async unlog() {
    const token = this.token;
    if (token) {
      try {
        await ApiHelper.request('user/revoke', { method: 'DELETE' });
      } catch (e) { }
    }

    this.token = undefined;
    this.user = undefined;
    this._logged = LoginStatus.None;
    this._login_promise = Promise.resolve(false);
  }
}();

export default Settings;

window.DEBUG.Settings = Settings;
