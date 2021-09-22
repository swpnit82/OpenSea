import { ServiceAddons } from '@feathersjs/feathers'
import { Application } from '../../../declarations'
import { Seat } from './seat.class'
import createModel from './seat.model'
import hooks from './seat.hooks'
import seatDocs from './seat.docs'

// Add this service to the service type index
declare module '../../../declarations' {
  interface ServiceTypes {
    seat: Seat & ServiceAddons<any>
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
  const event = new Seat(options, app)
  event.docs = seatDocs
  app.use('/seat', event)

  /**
   * Get our initialized service so that we can register hooks
   *
   * @author Vyacheslav Solovjov
   */
  const service = app.service('seat')

  service.hooks(hooks as any)
}
