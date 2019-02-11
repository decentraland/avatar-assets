import { runProgram } from 'decentraland-server/dist/cli'

import * as bundle from './commands/bundle'

const getProgram = () => {
  return {
    addCommands(program) {
      bundle.register(program)
    }
  }
}

const main = () => runProgram([getProgram()])

if (require.main === module) {
  Promise.resolve()
    .then(main)
    .catch(console.error)
}
