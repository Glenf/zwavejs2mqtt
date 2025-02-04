const chai = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')

chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))
const should = chai.should()

const mod = rewire('../../lib/jsonStore')

const jsonStore = require('../../lib/jsonStore')

describe('#jsonStore', () => {
  describe('#getFile()', () => {
    const config = { file: 'foo', default: 'defaultbar' }
    beforeEach(() => {
      sinon.stub(mod.__get__('utils'), 'joinPath')
      sinon.stub(mod.__get__('jsonfile'), 'readFile')
    })
    afterEach(() => {
      mod.__get__('utils').joinPath.restore()
      mod.__get__('jsonfile').readFile.restore()
    })

    it('uncaught error', () => {
      mod.__get__('jsonfile').readFile.rejects(new Error('FOO'))
      return jsonStore
        ._getFile(config)
        .should.eventually.be.rejectedWith(Error, 'FOO')
    })

    it('data returned', () => {
      const toReturn = {
        file: 'foo',
        data: 'mybar'
      }
      mod.__get__('jsonfile').readFile.resolves(toReturn.data)
      return jsonStore._getFile(config).should.eventually.deep.equal(toReturn)
    })

    it('no data, return default', () => {
      mod.__get__('jsonfile').readFile.resolves(null)
      return jsonStore._getFile(config).should.eventually.deep.equal({
        file: 'foo',
        data: 'defaultbar'
      })
    })

    it('file not found, return default', () => {
      mod.__get__('jsonfile').readFile.rejects({ code: 'ENOENT' })
      return jsonStore._getFile(config).should.eventually.deep.equal({
        file: 'foo',
        data: 'defaultbar'
      })
    })
  })

  describe('#StorageHelper', () => {
    jsonStore.store = {}
    it('class test', () => {
      jsonStore.store.should.deep.equal({})
    })

    describe('#init()', () => {
      beforeEach(() => {
        jsonStore.store = { known: 'no', foobar: 'foo' }
        sinon.stub(jsonStore, '_getFile').resolves({ file: 'foo', data: 'bar' })
      })
      afterEach(() => {
        jsonStore._getFile.restore()
      })
      it('ok', () =>
        jsonStore.init({ file: 'foobar' }).should.eventually.deep.equal({
          known: 'no',
          foobar: 'foo',
          foo: 'bar'
        }))
      it('error', () => {
        jsonStore._getFile.rejects('fo')
        return jsonStore.init({ file: 'foobar' }).should.eventually.be.rejected
      })
    })

    describe('#get()', () => {
      beforeEach(() => {
        jsonStore.store = { known: 'foo' }
      })
      it('known', () => jsonStore.get({ file: 'known' }).should.equal('foo'))
      it('unknown', () =>
        should.Throw(
          () => jsonStore.get({ file: 'unknown' }),
          'Requested file not present in store: unknown'
        ))
    })

    describe('#put()', () => {
      beforeEach(() => {
        sinon.stub(mod.__get__('jsonfile'), 'writeFile')
      })
      afterEach(() => {
        mod.__get__('jsonfile').writeFile.restore()
      })
      it('ok', () => {
        mod.__get__('jsonfile').writeFile.resolves()
        return mod
          .put({ file: 'foo' }, 'bardata')
          .should.eventually.equal('bardata')
      })
      it('error', () => {
        mod.__get__('jsonfile').writeFile.rejects(new Error('bar'))
        mod.put({ file: 'foo' }).should.be.rejectedWith('bar')
      })
    })
  })
})
