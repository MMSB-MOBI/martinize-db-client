import React from 'react';
import './Explore.scss';
import { setPageTitle } from '../../helpers';
import { makeStyles, Typography } from '@material-ui/core';
import { RouteComponentProps } from 'react-router-dom';
import qs from 'qs';
import { Molecule } from '../../types/entities';
import ApiHelper from '../../ApiHelper';

interface Filters {
  versions?: string[];
  force_fields?: string[];
  free_text: string;
  author: string;
  categories?: string[];
}

// Icon <Icon className="fas fa-camera" />
const useStyles = makeStyles(theme => {

});


const Explore = (props: RouteComponentProps) => {
  const classes = useStyles();
  const [filters, setFilters] = React.useState<Filters | undefined>();
  const [molecules, setMolecules] = React.useState([] as Molecule[]);
  const [page, setPage] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setPageTitle("Explore");

    // Read from query string
    const query_string = qs.parse(props.location.search, { ignoreQueryPrefix: true });

    function parseArray(key: string) {
      const v = query_string[key] as string;

      if (v) {
        return v.split(',');
      }
      return [];
    }

    const new_filters = {
      free_text: query_string.free_text || "",
      author: query_string.author || "",
      versions: parseArray('versions'),
      force_fields: parseArray('force_fields'),
      categories: parseArray('categories'),
    };
    setFilters(new_filters);

    if (query_string.page) {
      const nb = Number(query_string.page);
      if (nb > 0) {
        setPage(nb);
      }
    }

    // Start the download (should fire, setFilters is triggered.)
  }, []);
  
  React.useEffect(() => {
    if (!filters)
      return;

    console.log("Downloading with filters");

    // TODO make the real download with filters !!
    setLoading(true);
    setMolecules([]);

    ApiHelper.request('molecule/list', { latency: 2500 })
      .then(mols => {
        setLoading(false);
        setMolecules(mols);
      })
      .catch(e => {
        // TODO toaster !
        console.error(e);
        setLoading(false);
      })
  }, [filters]);

  return (
    <div>
      Hello, this is molecule list.

      {loading && <Typography color="error">
        Loading...  
      </Typography>}

      {!loading && <pre style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
        <code>
          {JSON.stringify(molecules, null, 2)}
        </code>
      </pre>}
    </div>
  );
}

export default Explore;
