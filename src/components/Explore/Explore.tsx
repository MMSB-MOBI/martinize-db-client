import React from 'react';
import './Explore.scss';
import { setPageTitle } from '../../helpers';

// Icon <Icon className="fas fa-camera" />

const Explore = () => {
  React.useEffect(() => {
    setPageTitle("Molecule List");
  }, []);

  return (
    <div className="Home">
      <header className="Home-header">
        <p>
           Edit <code>src/Root.tsx</code> and save to reload.
        </p>
        <a
          className="Home-link"
          href="https://fr.reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default Explore;
