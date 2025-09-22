import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];
  const { journalEntries, accounts, userInput } = state;

  if (userInput.format) {
    const periodRange = utils.getMaximumPeriodRange(journalEntries);

    const startPeriod = isNaN(userInput.startPeriod.valueOf())
      ? periodRange.earliest
      : userInput.startPeriod;

    const endPeriod = isNaN(userInput.endPeriod.valueOf())
      ? periodRange.latest
      : userInput.endPeriod;

    const accountNumbers = accounts.map(a => a.ACCOUNT);

    const startAccount = isNaN(userInput.startAccount)
      ? Math.min(...accountNumbers)
      : userInput.startAccount;

    const endAccount = isNaN(userInput.endAccount)
      ? Math.max(...accountNumbers)
      : userInput.endAccount;

    const filteredAccounts = accounts.filter(account => {
      return account.ACCOUNT >= startAccount && account.ACCOUNT <= endAccount;
    });

    const journalForPeriod = journalEntries.filter(entry => {
      return entry.PERIOD >= startPeriod && entry.PERIOD <= endPeriod;
    });

    balance = filteredAccounts.map(account => {
      const journalForAccount = journalForPeriod.filter(entry => {
        return entry.ACCOUNT === account.ACCOUNT;
      });

      const credit = journalForAccount.reduce((acc, entry) => acc + entry.CREDIT, 0);
      const debit = journalForAccount.reduce((acc, entry) => acc + entry.DEBIT, 0);

      return {
        ACCOUNT: account.ACCOUNT,
        DESCRIPTION: account.LABEL,
        CREDIT: credit,
        DEBIT: debit,
        BALANCE: debit - credit
      };
    });
  }

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);