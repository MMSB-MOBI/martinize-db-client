import React from 'react';
import Settings from '../../Settings';
import { Select, MenuItem, InputLabel, makeStyles, createStyles, Theme, useTheme, FormControl, Paper, TextField } from '@material-ui/core';
import { flattenCategoryTree, Marger } from '../../helpers';

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
  const [labelWidth, setLabelWidth] = React.useState(0);
  const inputLabel = React.useRef<HTMLLabelElement>(null);
  React.useEffect(() => {
    setLabelWidth(inputLabel.current!.offsetWidth);
  }, []);

  return (
    <FormControl variant="outlined" className={classes.formControl}>
      <InputLabel ref={inputLabel} id={props.id}>{props.label}</InputLabel>
      <Select 
        multiple 
        value={props.value}
        onChange={handleChange}
        labelWidth={labelWidth}
        inputProps={{
          name: 'age',
          id: props.id,
        }}
        MenuProps={MenuProps}
      >
        {props.options.map(v => <MenuItem key={v.value} value={v.value} style={getStyles(v.value, props.value, theme)}>
          {v.label || v.value}
        </MenuItem>)}
      </Select>
    </FormControl>
  );
}

const useStylesFilters = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: 14,
    },
    textWrapper: {
      display: 'grid',
      columnGap: '10px',
      gridTemplateColumns: '1fr 1fr 1fr',
    },
    freeTextWrapper: {
      display: 'grid',
    },
    selectorsWrapper: {
      display: 'grid',
      columnGap: '10px',
      gridTemplateColumns: '1fr 1fr 1fr',
    }
  }),
);

export default function MoleculeFilters(props: {
  onFiltersChange: (filters: Filters) => void;
  force_fields?: string[];
  q?: string;
  author?: string;
  categories?: string[];
  martinize_versions?: string[];
  name?: string;
  alias?: string;
  disableAuthor?: boolean;
}) {
  const settings = Settings.martinize_variables;
  const categories = React.useMemo(() => flattenCategoryTree(settings.category_tree), [settings]);
  const classes = useStylesFilters();

  function getAllFilters() {
    const e = {
      ...props
    };

    delete e.onFiltersChange;

    return e;
  }

  return (
    <Paper variant="outlined" className={classes.root}>
      <form onSubmit={e => e.preventDefault()}>
        <div className={classes.selectorsWrapper}>
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

          <MultipleSelect 
            options={settings.martinize_versions.map(e => ({ value: e }))} 
            value={props.martinize_versions || []}
            onChange={v => {
              const filters = getAllFilters();
              filters.martinize_versions = v;
              props.onFiltersChange(filters);
            }}
            id="mt-select"
            label="Martinize version"
          />

          <MultipleSelect 
            options={categories.map(e => ({ value: e.id, label: e.name }))} 
            value={props.categories || []}
            onChange={v => {
              const filters = getAllFilters();
              filters.categories = v;
              props.onFiltersChange(filters);
            }}
            id="cat-select"
            label="Categories"
          />
        </div>

        <Marger size="1rem" />
        
        <div className={classes.textWrapper}>
          <TextField 
            label="Name" 
            value={props.name || ""}
            onChange={v => {
              const filters = getAllFilters();
              filters.name = v.target.value;
              props.onFiltersChange(filters);
            }}
            variant="outlined"
          />

          <TextField 
            label="Alias" 
            value={props.alias || ""}
            onChange={v => {
              const filters = getAllFilters();
              filters.alias = v.target.value;
              props.onFiltersChange(filters);
            }}
            variant="outlined"
          />

          <TextField 
            label="Author" 
            value={props.author || ""}
            onChange={v => {
              const filters = getAllFilters();
              filters.author = v.target.value;
              props.onFiltersChange(filters);
            }}
            variant="outlined"
            disabled={props.disableAuthor}
          />
        </div>

        <Marger size="1rem" />
        
        <div className={classes.freeTextWrapper}>
          <TextField 
            label="Free text" 
            value={props.q || ""}
            onChange={v => {
              const filters = getAllFilters();
              filters.q = v.target.value;
              props.onFiltersChange(filters);
            }}
            variant="outlined"
          />
        </div>
      </form>
    </Paper>
  )
}
