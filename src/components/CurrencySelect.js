import React from "react";
import Select, {components} from "react-select";

import './flag-icon.css';

// Custom Option component for CurrencySelect
const Option = (props) => {
  const {isDisabled, data} = props;
  // console.log(props);

  return <components.Option {...props} className={`option ${data.value === 'none' ? 'empty-option' : ''} ${isDisabled ? 'disabled' : ''}`}>
    {data.value !== 'none' ? <><span className={`flag-icon flag-icon-${data.flag}`}/>
    <span className={'clabel'}>{data.label}</span>
    {data['balance'] ? <span className={'balance'}>{data.unit} {data.balance}</span> : null}</> : null}
  </components.Option>;
}

// Custom ValueContainer component for CurrencySelect
const ValueContainer = ({children, ...props}) => {
  const v = props.getValue();

  return v[0] ? <components.ValueContainer {...props} className={'value-container'}>
    <span className={`flag-icon flag-icon-${v[0].flag}`}/>
    <span>{v[0].label}</span>
    {children[1] ? <div>{[children[1]]}</div> : null}
  </components.ValueContainer> : null;
}

// CurrencySelect component
export function CurrencySelect(props) {
  return <Select
    {...props}
    className={"currency-select"}
    // menuIsOpen={true}
    components={{
      ValueContainer,
      Option,
    }}/>;
}