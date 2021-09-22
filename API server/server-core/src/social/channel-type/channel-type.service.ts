import { ServiceAddons } from '@feathersjs/feathers'
import { Application } from '../../../declarations'
import { ChannelType } from './channel-type.class'
import createModel from './channel-type.model'
import hooks from './channel-type.hooks'
import channelTypeDocs from './channel-type.docs'

declare module '../../../declarations' {
  interface ServiceTypes {
    'channel-type': ChannelType & ServiceAddons<any>
  }
}

export default (app: Application): any => {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  }

  /**
   * Initialize our service with any options it requires and docs
   *
   * @author Vyacheslav Solovjov
   */
  const event = new ChannelType(options, app)
  event.docs = channelTypeDocs

  app.use('/channel-type', event)

  const service = app.service('channel-type')

  service.hooks(hooks as any)
}
