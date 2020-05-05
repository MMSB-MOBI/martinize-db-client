import React from 'react';
import { Button, Typography, Box } from '@material-ui/core';

export interface MoleculeFilesInput { 
  itp: File[], 
  pdb: File | undefined, 
  top: File | undefined,
  map: File[],
}

function ThreeGrid(props: React.PropsWithChildren<{ enable: boolean }>) {
  if (props.enable) {
    return (
      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr">
        {props.children}
      </Box>
    );
  }
  return (
    <React.Fragment>
      {props.children}
    </React.Fragment>
  );
}

export default function AddMoleculeFileInput(props: { 
  onChange: (files: MoleculeFilesInput) => void,
  showMap?: boolean,
  useGrid?: boolean,
  allowMultiple?: boolean,
  optionalTop?: boolean,
}) {
  const [itpFileInputs, setItpFileInputs] = React.useState([[String(Math.random()), null]] as [string, File | null][]);
  const [mapFileInputs, setMapFileInputs] = React.useState([] as [string, File | null][]);
  const [pdbInput, setPdbInput] = React.useState<File>();
  const [topInput, setTopInput] = React.useState<File>();

  function addInput(type: 'itp' | 'map', file?: File) {
    const id = String(Math.random());

    if (type === 'itp') {
      setItpFileInputs([...itpFileInputs, [id, file ?? null]]);
    }
    else {
      setMapFileInputs([...mapFileInputs, [id, file ?? null]]);
    }

    return id;
  }

  function removeInput(id: string, type: 'itp' | 'map') {
    let filtered: [string, File | null][];
    if (type === 'itp') {
      filtered = itpFileInputs.filter(e => e[0] !== id);
      setItpFileInputs(filtered);
    }
    else {
      filtered = mapFileInputs.filter(e => e[0] !== id);
      setMapFileInputs(filtered);
    }

    props.onChange({
      itp: (type === 'itp' ? filtered : itpFileInputs).map(e => e[1]).filter(e => !!e) as File[],
      map: (type === 'map' ? filtered : mapFileInputs).map(e => e[1]).filter(e => !!e) as File[],
      pdb: pdbInput,
      top: topInput,
    });
  }

  function changeInput(id: string, type: 'map' | 'itp', file?: File[]) {
    let result: [string, File | null][];
    const selected = (type === 'map' ? mapFileInputs : itpFileInputs).findIndex(f => f[0] === id);

    if (selected === -1) {
      throw new Error("This message should not appear");
    }

    let to_add = 0;

    if (file && file.length > 1) {
      to_add = file.length - 1;
    }

    if (type === 'itp') {
      result = [...itpFileInputs];
      result[selected][1] = (file ? file[0] : undefined) ?? null;

      for (let i = 0; i < to_add; i++) {
        result.push([String(Math.random()), file![i+1]]);
      }

      setItpFileInputs(result);
    }
    else {
      result = [...mapFileInputs];
      result[selected][1] = (file ? file[0] : undefined) ?? null;

      for (let i = 0; i < to_add; i++) {
        result.push([String(Math.random()), file![i+1]]);
      }

      setMapFileInputs(result);
    }
    
    props.onChange({
      itp: (type === 'itp' ? result : itpFileInputs).map(e => e[1]).filter(e => !!e) as File[],
      map: (type === 'map' ? result : mapFileInputs).map(e => e[1]).filter(e => !!e) as File[],
      pdb: pdbInput,
      top: topInput,
    });
  }

  function onPdbChange(file?: File[]) {
    setPdbInput(file ? file[0] : undefined);

    props.onChange({
      itp: itpFileInputs.map(e => e[1]).filter(e => !!e) as File[],
      map: mapFileInputs.map(e => e[1]).filter(e => !!e) as File[],
      pdb: file ? file[0] : undefined,
      top: topInput,
    });
  }

  function onTopChange(file?: File[]) {
    setTopInput(file ? file[0] : undefined);

    props.onChange({
      itp: itpFileInputs.map(e => e[1]).filter(e => !!e) as File[],
      map: mapFileInputs.map(e => e[1]).filter(e => !!e) as File[],
      pdb: pdbInput,
      top: file ? file[0] : undefined,
    });
  }

  return (
    <ThreeGrid enable={!!props.useGrid}>
      <div>
        {/* Single PDB file input */}
        <Typography gutterBottom>
          Coarse-grained PDB/GRO file
        </Typography>
        <div>
          <FileInput 
            has={pdbInput ? pdbInput.name : ""} 
            onFileChange={onPdbChange} 
          />
        </div>

        {/* Single TOP file input */}
        <Typography gutterBottom>
          Generated TOP file {props.optionalTop ? ' (if any)' : ' (by Martinize)'}
        </Typography>
        <div>
          <FileInput 
            has={topInput ? topInput.name : ""} 
            onFileChange={onTopChange} 
          />
        </div>
      </div>

      <div>
        <Typography gutterBottom>
          Generated ITP files
        </Typography>
        <div>
          {itpFileInputs.map((f, i) => <FileInput 
            has={f[1] ? f[1].name : ""}
            multiple={f[1] ? false : true}
            onFileChange={file => changeInput(f[0], 'itp', file)}
            onRemove={i !== 0 ? () => removeInput(f[0], 'itp') : undefined}
            key={f[0]}
          />)}
        </div>
        <Button color="primary" onClick={() => addInput('itp')}>
          Add another ITP file
        </Button>
      </div>

      <div>
        <Typography gutterBottom>
          Optional mapping files
        </Typography>
        <div>
          {mapFileInputs.map(f => <FileInput 
            has={f[1] ? f[1].name : ""}
            multiple={f[1] ? false : true}
            onFileChange={file => changeInput(f[0], 'map', file)}
            onRemove={() => removeInput(f[0], 'map')}
            key={f[0]}
          />)}
        </div>
        <Button color="primary" onClick={() => addInput('map')}>
          Add a MAP file
        </Button>
      </div>
    </ThreeGrid>
  )
}

function FileInput(props: { multiple?: boolean, has?: string, onFileChange: (file?: File[]) => void, onRemove?: () => void, }) {
  const inputRef = React.createRef<HTMLInputElement>();

  function click() {
    inputRef.current!.click();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
      {props.onRemove && <Button color="secondary" onClick={props.onRemove} style={{ marginRight: 10 }}>
        Remove
      </Button>}

      <Button color="primary" onClick={click} style={{ marginRight: 10 }}>
        {props.has ? "Change" : "Add file"}
      </Button>

      <Typography variant="body2">
        {props.has || "Select a file..."}
      </Typography>

      <input type="file" ref={inputRef} multiple={props.multiple} style={{ display: 'none' }} onChange={e => {
        const input = e.target;

        if (input.files && input.files[0]) {
          props.onFileChange([...input.files]);
        }
        else {
          props.onFileChange();
        }
      }} />
    </div>
  );
}
