const {
  FUNDING_GOAL,
  PERCENT_SUPPLY_OFFERED,
  VESTING_CLIFF_PERIOD,
  VESTING_COMPLETE_PERIOD,
  SALE_STATE,
  CONNECTOR_WEIGHT,
  TAP_RATE,
  FUNDING_PERIOD,
  ZERO_ADDRESS,
  PERCENT_FUNDING_FOR_BENEFICIARY
} = require('./common/constants')
const {
  prepareDefaultSetup,
  initializePresale,
  defaultDeployParams,
  deployDefaultSetup
} = require('./common/deploy')
const { tokenExchangeRate } = require('./common/utils')
const { assertRevert } = require('@aragon/test-helpers/assertThrow')

contract('Setup', ([anyone, appManager, someEOA]) => {

  describe('When deploying the app with valid parameters', () => {

    let presaleInitializationTx

    before(async () => {
      presaleInitializationTx = await deployDefaultSetup(this, appManager)
    })

    it('App gets deployed', async () => {
      expect(web3.isAddress(this.presale.address)).to.equal(true)
    })

    it('Gas used is ~3.38e6', async () => {
      const gasUsed = presaleInitializationTx.receipt.gasUsed
      expect(gasUsed).to.be.below(3.38e6)
    })

    it('Deploys fundraising related apps', async () => {
      expect(web3.isAddress(this.pool.address)).to.equal(true)
    })

    it('Funding goal and percentage offered are set', async () => {
      expect((await this.presale.fundingGoal()).toNumber()).to.equal(FUNDING_GOAL)
      expect((await this.presale.percentSupplyOffered()).toNumber()).to.equal(PERCENT_SUPPLY_OFFERED)
    })

    it('Dates and time periods are set', async () => {
      expect((await this.presale.vestingCliffPeriod()).toNumber()).to.equal(VESTING_CLIFF_PERIOD)
      expect((await this.presale.vestingCompletePeriod()).toNumber()).to.equal(VESTING_COMPLETE_PERIOD)
      expect((await this.presale.fundingPeriod()).toNumber()).to.equal(FUNDING_PERIOD)
    })

    it('Initial state is Pending', async () => {
      expect((await this.presale.currentSaleState()).toNumber()).to.equal(SALE_STATE.PENDING)
    })

    it('Project token is deployed and set in the app', async () => {
      expect(web3.isAddress(this.projectToken.address)).to.equal(true)
      expect((await this.presale.projectToken())).to.equal(this.projectToken.address)
    })

    it('Contribution token is deployed and set in the app', async () => {
      expect(web3.isAddress(this.contributionToken.address)).to.equal(true)
      expect((await this.presale.contributionToken())).to.equal(this.contributionToken.address)
    })

    it('TokenManager is deployed, set in the app, and controls the project token', async () => {
      expect(web3.isAddress(this.tokenManager.address)).to.equal(true)
      expect((await this.presale.projectTokenManager())).to.equal(this.tokenManager.address)
    })

    it('Exchange rate is calculated to the expected value', async () => {
      const receivedValue = (await this.presale.tokenExchangeRate()).toNumber()
      const expectedValue = tokenExchangeRate()
      expect(receivedValue).to.equal(expectedValue)
    })

    it('Beneficiary address is set', async () => {
      expect((await this.presale.beneficiaryAddress())).to.equal(appManager)
    })

    it('Percent funding for beneficiary is set', async () => {
      expect((await this.presale.percentFundingForBeneficiary()).toNumber()).to.equal(PERCENT_FUNDING_FOR_BENEFICIARY)
    })
  })

  describe('When deploying the app with invalid parameters', () => {

    let defaultParams;

    before(async () => {
      await prepareDefaultSetup(this, appManager)
      defaultParams = defaultDeployParams(this, appManager)
    })

    it('Reverts when setting an invalid contribution token', async () => {
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          contributionToken: someEOA
        }), 'PRESALE_INVALID_CONTRIBUTE_TOKEN'
      )
    })

    it('Reverts when setting an invalid fundraising pool', async () => {
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          pool: someEOA
        }), 'PRESALE_INVALID_POOL'
      )
    })

    it('Reverts when setting invalid dates', async () => {
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          fundingPeriod: 0
        }), 'PRESALE_INVALID_TIME_PERIOD'
      )
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          vestingCliffPeriod: defaultParams.fundingPeriod - 1
        }), 'PRESALE_INVALID_TIME_PERIOD'
      )
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          vestingCompletePeriod: defaultParams.vestingCliffPeriod - 1
        }), 'PRESALE_INVALID_TIME_PERIOD'
      )
    })

    it('Reverts when setting an invalid funding goal', async () => {
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          fundingGoal: 0
        }), 'PRESALE_INVALID_FUNDING_GOAL'
      )
    })

    it('Reverts when setting an invalid percent supply offered', async () => {
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          percentSupplyOffered: 0
        }), 'PRESALE_INVALID_PERCENT_VALUE'
      )
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          percentSupplyOffered: 1e6 + 1
        }), 'PRESALE_INVALID_PERCENT_VALUE'
      )
    })

    it('Reverts when setting an invalid percent funding for beneficiary', async () => {
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          percentFundingForBeneficiary: 0
        }), 'PRESALE_INVALID_PERCENT_VALUE'
      )
      await assertRevert(
        initializePresale(this, { ...defaultParams,
          percentFundingForBeneficiary: 1e6 + 1
        }), 'PRESALE_INVALID_PERCENT_VALUE'
      )
    })

    it('Reverts when setting an invalid beneficiary address', async () => {
      initializePresale(this, { ...defaultParams,
        beneficiaryAddresss: ZERO_ADDRESS
      }), 'PRESALE_INVALID_BENEFIC_ADDRESS'
    })
  })
})
