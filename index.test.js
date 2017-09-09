/* eslint-env mocha */
const assert = require('assert')

const Eos = require('.')

if(process.env['NODE_ENV'] === 'development') {// avoid breaking travis-ci

  describe('networks', () => {
    it('testnet', (done) => {
      eos = Eos.Testnet()
      eos.getBlock(1, (err, block) => {
        if(err) {
          throw err
        }
        done()
      })
    })
  })

  describe('transactions', () => {
    const wif = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
    const chainId = new Buffer('\0'.repeat(32))

    const signProvider = ({sign, buf}) => {
      buf = Buffer.concat([chainId, buf])
      return sign(buf, wif)
    }

    const promiseSigner = (args) => Promise.resolve(signProvider(args))

    it('usage', () => {
      eos = Eos.Testnet({signProvider})
      eos.transfer()
    })

    it('newaccount', () => {
      eos = Eos.Testnet({signProvider, debug: false})
      const pubkey = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'
      const auth = {threshold: 1, keys: [{key: pubkey, weight: 1}], accounts: []}
      const name = 'acct' + String(Math.round(Math.random() * 100000)).replace(/[0,6-9]/g, '')

      return eos.newaccount({
        creator: 'inita',
        name,
        owner: pubkey,
        active: pubkey,
        recovery: pubkey,
        deposit: '10 EOS'
      })
    })

    it('transfer (broadcast)', () => {
      eos = Eos.Testnet({signProvider})
      return eos.transfer('inita', 'initb', 1, '')
    })

    it('transfer (no broadcast)', () => {
      eos = Eos.Testnet({signProvider})
      return eos.transfer('inita', 'initb', 1, '', {broadcast: false})
    })

    it('transfer (no broadcast, no sign)', () => {
      eos = Eos.Testnet({signProvider})
      const opts = {broadcast: false, sign: false}
      return eos.transfer('inita', 'initb', 1, '', opts).then(tr => 
        assert.deepEqual(tr.signatures, [])
      )
    })

    it('transfer sign promise (no broadcast)', () => {
      eos = Eos.Testnet({signProvider: promiseSigner})
      return eos.transfer('inita', 'initb', 1, '', false)
    })

    it('custom transfer', () => {
      eos = Eos.Testnet({signProvider})
      return eos.transaction({
        scope: ['inita', 'initb'],
        messages: [
          {
            code: 'eos',
            type: 'transfer',
            data: {
              from: 'inita',
              to: 'initb',
              amount: '13',
              memo: '爱'
            },
            authorization: [{
              account: 'inita',
              permission: 'active'
            }]
          }
        ],
        broadcast: false
      })
    })

  })

} // if development