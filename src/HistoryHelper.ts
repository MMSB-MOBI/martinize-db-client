import Settings from './Settings'
import ApiHelper from './ApiHelper'
import { RawJobDoc} from './types/entities'

export async function getHistory(): Promise<RawJobDoc[]>{
    const userId = Settings.user?.id
    return ApiHelper.request(`history/list`, {parameters : {user:userId}})
}
