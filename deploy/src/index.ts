import { Log } from 'decentraland-commons'
import { runProgram } from 'decentraland-server/dist/cli'

import * as bundle from './commands/bundle'
import * as init from './commands/init'

const log = new Log('cmd')

const commands = [init, bundle]

const registerCommand = (program: any, command: any) => {
  try {
    command.register(program)
  } catch (err) {
    log.error(err.message)
  }
}

const getProgram = () => {
  return {
    addCommands(program: any) {
      for (const command of commands) {
        registerCommand(program, command)
      }
    }
  }
}

const main = () => runProgram([getProgram()])

if (require.main === module) {
  Promise.resolve()
    .then(main)
    .catch(console.error)
}
