# Polymer Editor Client Documentation

## Introduction
Welcome to the documentation for the Polymer Generator. This tool was added after the design of MAD, which is why it may not fully align with the philosophy of the entire website. I tried my best to adhere to the design principles, but my programming skills were not strong enough initially. The goal of this feature is to enable users to utilize [Polyply](https://github.com/marrink-lab/polyply_1.0) through a web-based graphical interface. To achieve this, we allow users to connect, add circles representing monomers, and then send the data to the server to run Polyply and generate the structure of their polymer. 

There are three main components in Polymer Editor: [GeneratorManager](GeneratorManager.tsx), [GeneratorMenu](GeneratorMenu.tsx), and [GeneratorViewer](GeneratorViewer.tsx). The componenent Manager allow to communicate bewtenn the other comonents (the menu and the viewer) and also with the server though socketIo. The viewer allows users to interact with their molecule through a custom right-click panel menu, which changes based on the location clicked (a molecule, a link, or nowhere) and provides a feature (remove residue, select the whole molecule/polymer, remove the link, and more). The menu allows users to add new residues, load molecules, generate links, and, once the molecule is complete, send it to the server for file generation.

### Generator Manager

This component acts as the central hub, facilitating communication between the menu, the viewer, and the server via socket.io. There are three socket "processes" involved: one for generating the topology, another for creating coordinate files in the GRO format, and the last one for converting the GRO file into a PDB file. These processes allow for rendering a representation of the polymer for the user. If any issues arise on the server, an error socket is sent, containing error details that are displayed to the client. Keep in memory an id and update if you remove or add new nodes. Manage the uploading of an itp file and extract infirmation to add node in the viewer and upload the list of residue avaible; 

### Generator Viewer
The Generator Viewer employs D3 within an SVG frame to manage all the monomers you can add. D3 is exceptionally convenient as it enables the translation of graph theory principles to polymer representation. In this context, each monomer becomes a node, and the links between monomers translate into links between nodes. All this information is available in a JSON file, which is consumed by Polyply as input to create a polymer.

To enhance the visual representation, we've implemented D3 simulation, which automatically moves nodes for a more balanced depiction.  We wanted to make a represenation good link so we implement the D3 simulation to move the node automatically for a better represenantion. Please check the [Documention](https://d3js.org/d3-force/simulation) for more information, but basically it's a like a molecuar simulation and every node in the svg are moving each time step to be mode equilibrate in the svg. 

The simulation object is inititated with the function : initSimulation in [ViewerFunction.ts](ViewerFunction.ts). This object is very important because this is the link betwenn all the component, it represents the content of the polymer in term of links and nodes. We also applied differents forces to be able to center the nodes depending of the size of the screen and applied a good distance between them for a better vizulaisation.
After you can use reloadSimulation in [ViewerFunction.ts](ViewerFunction.ts) to reload the simulation because a position have changed or a new node have been added or whatever event. 
You have additional function that allow to add node with event that allow to move or clik on it and also remove or create link. 

Additionally, there are functions to add nodes with associated events for movement and clicking, as well as for removing or creating links. This component receives modifications from the parent component (Generator Manager) via props, prompting the component to activate the update function and refresh the simulation with the newly added node(s).


### Generator Menu 