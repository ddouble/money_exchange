import React, {useEffect} from "react";
import './App.css';

import {Backdrop, Button, CircularProgress} from "@material-ui/core";
import {Alert} from "@material-ui/lab";
import CheckCircleTwoToneIcon from '@material-ui/icons/CheckCircleTwoTone';
import {IMaskInput} from "react-imask";
import IMask from "imask";

/**
 * check if val is a number
 */
function isNumber(val) {
  return !isNaN(+val);
}

let wallets = [
  {currency: 'usd', balance: 200},
  {currency: 'gbp', balance: 380},
  {currency: 'eur', balance: 5230}
];

let currenies = [
  {label: 'USD', value: 'usd', unit: '$'},
  {label: 'GBP', value: 'gbp', unit: '£'},
  {label: 'EUR', value: 'eur', unit: '€'}
];

// generate random integer which less than max
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// round money value which represent by float
// todo: use cent unit and integer to represent money
function roundMoney(val) {
  return Math.round(val * 100) / 100;
}

// format currency number
const currencyFormatter = IMask.createPipe({
  mask: Number,
  scale: 2,
  radix: '.',
  signed: false,
  unmask: 'typed',
  thousandsSeparator: ',',
  padFractionalZeros: false
});

function App() {
  const [amount, setAmount] = React.useState('');
  const [rates, setRates] = React.useState({});
  const [fromCurrencyVal, setFromCurrencyVal] = React.useState('usd');
  const [toCurrencyVal, setToCurrencyVal] = React.useState('none');
  const [isExchanging, setIsExchanging] = React.useState(null);
  const [isExchangeSuccess, setIsExchangeSuccess] = React.useState(false);

  const [errors, setErrors] = React.useState({});

  // clear specific error
  function clearError(name) {
    setErrors(errors => {
      const _errors = {...errors};
      if (_errors[name]) delete _errors[name]
      return _errors;
    });
  }


  // initialize on app load
  useEffect(() => {
    // validate['amount'](amount);
    validate['from-currency'](fromCurrencyVal);
    validate['to-currency'](toCurrencyVal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refresh exchange rate when from-currency or to-currency is changed
  useEffect(() => {
    fetch(`https://api.frankfurter.app/latest?base=${encodeURIComponent(fromCurrencyVal)}`)
      .then(res => res.json())
      .then(
        result => {
          setRates(result.rates);

          // clear previous error
          clearError('fetchRate');
        },
      )
      .catch(
        error => {
          setErrors(errors => ({
            ...errors,
            fetchRate: {message: 'Cannot update exchange rates [ ' + error + ' ]'}
          }));
        }
      );

  }, [fromCurrencyVal, toCurrencyVal]);

  // input validation functions
  const validate = {
    'amount': (val) => {
      if (val > currentWallet.balance) {
        setErrors({
          ...errors,
          amount: {message: 'No sufficient balance.'}
        })
      } else {
        clearError('amount');
      }
    },

    'from-currency': (val) => {
      if (val === toCurrencyVal) {
        setErrors({
          ...errors,
          'to-currency': {
            message: 'Exchange can only be done in different currency.'
          }
        })
      } else {
        clearError('to-currency');
      }
    },

    'to-currency': (val) => {
      if (val === fromCurrencyVal) {
        setErrors({
          ...errors,
          'to-currency': {
            message: 'Exchange can only be done in different currency.'
          }
        })
      } else {
        clearError('to-currency');
      }
    }
  }

  // const onAmountChange = (event) => {
  //   setAmount(parseFloat(event.target.value));
  //   validate[event.target.name](event.target.value);
  // };

  const onAmountChange = (value, mask) => {
    setAmount(mask.unmaskedValue);
    validate[mask.el.input.name](mask.unmaskedValue);
  };

  const onFromCurrencyChange = (event) => {
    setFromCurrencyVal(event.target.value);
    setAmount('');
    validate[event.target.name](event.target.value);
    validate['amount']('');
  }

  const onToCurrencyChange = (event) => {
    setToCurrencyVal(event.target.value);
    validate[event.target.name](event.target.value);
  }

  function onSwitchClick() {
    // don't switch if to-currency hasn't be selected
    if (toCurrencyVal === 'none') return;

    if (toCurrencyVal !== fromCurrencyVal) {
      const from = fromCurrencyVal;
      setAmount('');
      setFromCurrencyVal(toCurrencyVal);
      setToCurrencyVal(from);
    }
  }

  // call server api to exchange when click the exchange button
  // here is just a simulation by local data operation
  useEffect(() => {
    if (isExchanging) {
      /**
       * simulate long-time server operation
       * there are one sixth opportunities to simulate failed status
       */

      const {rates, amount, toCurrencyVal, fromCurrencyVal} = isExchanging;
      const rate = rates[toCurrencyVal.toUpperCase()];
      const toAmount = roundMoney(amount * rate);
      // console.log(amount, rate, toAmount);

      setTimeout(() => {
        // simulate success/failed status
        const success = getRandomInt(5);
        if (success) {
          wallets.forEach((v, i) => {
            if (v.currency === fromCurrencyVal) v.balance = roundMoney(v.balance - amount);
            else if (v.currency === toCurrencyVal) v.balance = roundMoney(v.balance + toAmount);
          });

          setIsExchangeSuccess(true);

          // setTimeout(() => {
          //   setIsExchanging(null);
          // }, 5000);
        } else {
          setErrors(errors => ({
            ...errors,
            exchange: {message: 'Exchange failed.'}
          }));

          // clear exchange error notify after seconds
          setTimeout(() => {
            clearError('exchange');
          }, 10000);
          setIsExchanging(null);
        }
      }, 2000);
    }
  }, [isExchanging]);

  function onContinueClick() {
    setIsExchanging({rates, amount, toCurrencyVal, fromCurrencyVal});
    setIsExchangeSuccess(false);

    // clear previous exchange error
    clearError('exchange');
  }

  function onExchangeNotifyClick() {
    if (isExchangeSuccess) {
      setIsExchanging(null);
      setIsExchangeSuccess(false);
    }
  }

  // search currency information
  const currency = (currencyValue) => {
    // todo: optimize searching performance
    return currenies.find((v) => v.value === currencyValue)
  }

  // search wallet information
  const wallet = (currencyValue) => {
    // todo: optimize searching performance
    return wallets.find((v) => v.currency === currencyValue)
  }

  // check if there are errors which block operation
  function hasBlockedError() {
    const errorCount = Object.keys(errors).length;
    if (errorCount === 1 && errors['exchange']) return false;
    return errorCount > 0;
  }

  const currentWallet = wallet(fromCurrencyVal);
  const currentToWallet = wallet(toCurrencyVal);
  const fromCurrency = currency(fromCurrencyVal);
  const toCurrency = toCurrencyVal !== 'none' ? currency(toCurrencyVal) : null;

  // don't display to-currency == from-currency error message
  const {'to-currency': _v, ...rest} = errors;
  const alertMessage = Object.values(rest).map((v, i) => <div key={i}>{v.message}</div>);

  // current from-currency => to-currency rate
  const rate = toCurrencyVal !== 'none' ?
    ((fromCurrencyVal !== toCurrencyVal) ? rates[toCurrencyVal.toUpperCase()] : 1) : null;

  // expected amount after exchanging
  const toAmount = (isNumber(amount) && amount && rate) ? roundMoney(amount * rate) : '';

  // let amountInput = null;
  return (
    <div className="App">
      <h1>Money Exchange</h1>
      <div className={"clearfix"}>

        {/* from curreny */}
        <div className={"from-currency"}>
          <div className={"label noselect"}>Sell</div>
          <div className={"currency-input-box"}>
            <div className={"type-box"}>
              <select name={'from-currency'} value={fromCurrencyVal} onChange={onFromCurrencyChange}>
                {wallets.map((w, i) => {
                  let c = currency(w.currency);
                  return <option key={i} value={c.value}>{c.label}</option>
                })}
              </select>
            </div>
            <div className={`amount-box ${errors['amount'] ? "error" : ""}`}>
              {/* todo: use comma in number */}
              <label>{fromCurrency.unit}</label>
              {/*<input name={"amount"} onChange={onAmountChange} className={"amount"}*/}
              {/*       value={amount}*/}
              {/*       placeholder={"0.00"}/>*/}
              <IMaskInput name={"amount"} onAccept={onAmountChange} className={"amount"}
                          mask={Number}
                          scale={2}
                          radix={"."}
                          signed={false}
                          padFractionalZeros={false}
                          thousandsSeparator={","}
                          unmask={true}
                          // inputRef={el => amountInput = el}
                          value={amount}
                          placeholder={"0.00"}/>
            </div>
          </div>
          <div className={"balance"}>Balance: <strong>{fromCurrency.unit}{currencyFormatter(currentWallet.balance.toString())}</strong></div>
        </div>
        <div className={"switch noselect"} onClick={onSwitchClick}>&lt;&gt;</div>

        {/* to curreny */}
        <div className={"to-currency"}>
          <div className={"label noselect"}>Get</div>
          <div className={"currency-input-box"}>
            <div className={`type-box ${errors['to-currency'] ? 'error' : ''}`}>
              <select name={'to-currency'} value={toCurrencyVal} onChange={onToCurrencyChange}>
                <option key={'none'} value={'none'} style={{color: '#eee'}}></option>
                {currenies.map((c, i) => (
                  // c.value != fromCurrencyVal ? <option key={i} value={c.value}>{c.label}</option> : null
                  <option key={i} disabled={c.value === fromCurrencyVal} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className={"amount-box"}>
              <label>{toCurrency ? toCurrency.unit : ''}</label>
              <input className={"amount"} readOnly={true}
                     value={currencyFormatter(toAmount.toString())}/>
            </div>
          </div>
          <div className={`rate ${!toCurrency ? 'hide' : ''}`}>
            1 {fromCurrency.label} = <strong>{rate}</strong> {toCurrency ? toCurrency.label : ''}
            {fromCurrencyVal !== toCurrencyVal ? <><br/>
              <span style={{color: "rgb(202, 120, 0)"}}>The rate might change anytime</span></> : null}</div>
        </div>
      </div>

      {/* alert message */}
      <div className={"alert-message-box"}>
        {/*<Alert severity={"info"}>The exchange rate might change anytime.</Alert>*/}
        {alertMessage.length ? <Alert severity={"error"}>{alertMessage}</Alert> : null}
      </div>

      <div>
        <Button disabled={!isNumber(amount) || !amount || !toCurrency || isExchanging !== null || hasBlockedError()}
                variant={"contained"}
                disableElevation
                color={"primary"} size={"large"}
                className={"exchange-button"}
                onClick={onContinueClick}>{!isExchanging ? 'Continue' : 'Exchanging ...'}</Button>
      </div>

      <Backdrop className={"exchange-notify"} open={isExchanging !== null} onClick={onExchangeNotifyClick}>
        {!isExchangeSuccess ? <div className={"exchange-progress"}><CircularProgress color="inherit"/></div> : null}
        {isExchangeSuccess ? <div className={"exchange-success-notify"}>
          <CheckCircleTwoToneIcon className={"icon"}/>
          <div className={"message"}>Completed<br/></div>
          <div className={"balance"}>
            <strong>{toCurrency.label}</strong> balance:
            <div className={'currency'}>{toCurrency.unit} {currencyFormatter(currentToWallet.balance.toString())}</div>
          </div>
        </div> : null}
      </Backdrop>
    </div>
  );
}

export default App;
