import React from 'react';
import Settings from '../../Settings';
import { Select, MenuItem, InputLabel, makeStyles, createStyles, Theme, Input, useTheme, FormControl } from '@material-ui/core';

export interface Filters {
  force_fields?: string[];
  q?: string;
  author?: string;
  categories?: string[];
  martinize_versions?: string[];
  name?: string;
  alias?: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
      maxWidth: 300,
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    chip: {
      margin: 2,
    },
    noLabel: {
      marginTop: theme.spacing(3),
    },
  }),
);

function getStyles(value: string, values: string[], theme: Theme) {
  return {
    fontWeight:
      values.indexOf(value) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function MultipleSelect(props: { 
  value: string[], 
  options: { value: string, label?: string }[], 
  onChange: (values: string[]) => void,
  label: string,
  id: string,
}) {
  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    props.onChange(event.target.value as string[]);
  };
  const theme = useTheme();
  const classes = useStyles();

  return (
    <FormControl className={classes.formControl}>
      <InputLabel id={props.id}>{props.label}</InputLabel>
      <Select 
        labelId={props.id}
        multiple 
        value={props.value}
        onChange={handleChange}
        input={<Input />}
        MenuProps={MenuProps}
      >
        {props.options.map(v => <MenuItem key={v.value} value={v.value} style={getStyles(v.value, props.value, theme)}>
          {v.label || v.value}
        </MenuItem>)}
      </Select>
    </FormControl>
  );
}

export default function MoleculeFilters(props: {
  onFiltersChange: (filters: Filters) => void;
  force_fields?: string[];
  q?: string;
  author?: string;
  categories?: string[];
  martinize_versions?: string[];
  name?: string;
  alias?: string;
}) {
  const settings = Settings.martinize_variables;
  function getAllFilters() {
    const e = {
      ...props
    };

    delete e.onFiltersChange;

    return e;
  }

  return (
    <div>
      <form onSubmit={e => e.preventDefault()}>
        <MultipleSelect 
          options={settings.force_fields.map(e => ({ value: e }))} 
          value={props.force_fields || []}
          onChange={v => {
            const filters = getAllFilters();
            filters.force_fields = v;
            props.onFiltersChange(filters);
          }}
          id="ff-select"
          label="Force field"
        />
      </form>
    </div>
  )
}
